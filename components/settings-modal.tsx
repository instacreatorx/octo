"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export interface SettingsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ open, onOpenChange }) => {
  const [loading, setLoading] = React.useState(false);
  const [openaiBaseUrl, setOpenaiBaseUrl] = React.useState("");
  const [openaiApiKey, setOpenaiApiKey] = React.useState("");
  const [hasOpenaiApiKey, setHasOpenaiApiKey] = React.useState(false);
  const [postgresUrl, setPostgresUrl] = React.useState("");
  const [mssqlUrl, setMssqlUrl] = React.useState("");

  React.useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
        const res = await fetch('/api/settings', { headers });
        if (res.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem("auth_token");
          window.location.href = '/login';
          return;
        }
        if (res.ok) {
          const data = await res.json();
          setOpenaiBaseUrl(data?.openaiBaseUrl ?? "");
          setHasOpenaiApiKey(!!data?.hasOpenaiApiKey);
          setOpenaiApiKey("");
          setPostgresUrl(data?.postgresUrl ?? "");
          setMssqlUrl(data?.mssqlUrl ?? "");
        }
      } catch (e) {
        console.error('Failed to load settings', e);
      }
    })();
  }, [open]);

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ openaiBaseUrl, openaiApiKey: openaiApiKey || undefined, postgresUrl, mssqlUrl })
      });
      if (res.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem("auth_token");
        window.location.href = '/login';
        return;
      }
      if (!res.ok) throw new Error('Failed to save');
      onOpenChange(false);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
        </DialogHeader>
        <Tabs defaultValue="configs">
          <TabsList>
            <TabsTrigger value="configs">Configs</TabsTrigger>
            <TabsTrigger value="appearance">Appearance</TabsTrigger>
          </TabsList>
          <TabsContent value="configs" className="space-y-4 mt-4">
            <div>
              <label className="block text-sm mb-1">OpenAI Base URL</label>
              <Input value={openaiBaseUrl} onChange={(e) => setOpenaiBaseUrl(e.target.value)} placeholder="https://..." />
            </div>
            <div>
              <label className="block text-sm mb-1">OPENAI API Key {hasOpenaiApiKey ? '(set)' : ''}</label>
              <Input value={openaiApiKey} onChange={(e) => setOpenaiApiKey(e.target.value)} placeholder={hasOpenaiApiKey ? '•••••• (leave blank to keep current)' : 'sk-...'} type="password" />
            </div>
            <div>
              <label className="block text-sm mb-1">Postgres URL</label>
              <Input value={postgresUrl} onChange={(e) => setPostgresUrl(e.target.value)} placeholder="postgres://..." />
            </div>
            <div>
              <label className="block text-sm mb-1">MSSQL URL</label>
              <Input value={mssqlUrl} onChange={(e) => setMssqlUrl(e.target.value)} placeholder="Server=localhost;Database=mydb;User Id=user;Password=pass;" />
            </div>
            <div className="pt-2">
              <Button onClick={handleSave} disabled={loading} className="w-full">{loading ? 'Saving...' : 'Save'}</Button>
            </div>
          </TabsContent>
          <TabsContent value="appearance" className="space-y-4 mt-4">
            <div className="text-sm text-muted-foreground">Theme is controlled by the theme toggle in the header.</div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};


