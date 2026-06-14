"use client";

import type { FC } from "react";
import { useEffect, useState } from "react";
import { PlusIcon, SearchIcon, MoreVertical, Trash2, Pencil } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

export const ThreadList: FC = () => {
  const [chats, setChats] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [showSearch, setShowSearch] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const router = useRouter();

  // Load chat history
  useEffect(() => {
    loadChatHistory();
  }, []);

  const loadChatHistory = async (pageNum: number = 1, append: boolean = false) => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
      const response = await fetch(`/api/chats?page=${pageNum}&limit=20`, { headers });
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem("auth_token");
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        if (append) {
          setChats(prev => [...prev, ...data.chats]);
        } else {
          setChats(data.chats || []);
        }
        setHasMore(data.pagination?.hasMore || false);
        setPage(pageNum);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = async () => {
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);
    await loadChatHistory(page + 1, true);
  };

  const handleChatClick = (chatId: string) => {
    router.push(`/chat/${chatId}`);
  };

  const handleNewChat = () => {
    router.push('/chat');
  };

  const handleDeleteChat = async (id: string) => {
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
      const res = await fetch(`/api/chats?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers });
      if (res.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem("auth_token");
        router.push('/login');
        return;
      }
      if (res.ok || res.status === 204) {
        setChats((prev) => prev.filter((c) => c.id !== id));
      }
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  const handleRenameChat = async (id: string) => {
    const title = prompt('Rename chat to:');
    if (!title) return;
    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
      const res = await fetch(`/api/chats`, { method: 'PATCH', headers, body: JSON.stringify({ id, title }) });
      if (res.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem("auth_token");
        router.push('/login');
        return;
      }
      if (res.ok || res.status === 204) {
        setChats((prev) => prev.map((c) => (c.id === id ? { ...c, title } : c)));
      }
    } catch (e) {
      console.error('Rename failed', e);
    }
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    try {
      const token = localStorage.getItem('auth_token')
      const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { headers });
      if (response.status === 401) {
        // Clear invalid token and redirect to login
        localStorage.removeItem("auth_token");
        router.push('/login');
        return;
      }
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
      }
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  return (
    <>
      <div className="flex flex-col items-stretch gap-1.5">
        <div className="flex items-center gap-2 p-2">
          <Button 
            onClick={handleNewChat}
            className="flex-1 justify-start gap-2"
            variant="ghost"
          >
            <PlusIcon className="h-4 w-4" />
            New Chat
          </Button>
          <Dialog open={showSearch} onOpenChange={setShowSearch}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm">
                <SearchIcon className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Search Chats</DialogTitle>
              </DialogHeader>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Input
                    placeholder="Search chat titles and messages..."
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      handleSearch(e.target.value);
                    }}
                    className="mb-4"
                  />
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {searchResults.map((result) => (
                      <div
                        key={result.id}
                        onClick={() => {
                          handleChatClick(result.id);
                          setShowSearch(false);
                        }}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-accent"
                      >
                        <div className="font-medium">{result.title}</div>
                        <div className="text-sm text-muted-foreground">
                          {result.excerpt}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex-1 border-l pl-4">
                  <h3 className="font-medium mb-2">Recent Chats</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {chats.slice(0, 10).map((chat) => (
                      <div
                        key={chat.id}
                        onClick={() => {
                          handleChatClick(chat.id);
                          setShowSearch(false);
                        }}
                        className="p-2 text-sm cursor-pointer hover:bg-accent rounded"
                      >
                        {chat.title}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        
        {loading ? (
          <div className="p-4 text-center text-muted-foreground">Loading chats...</div>
        ) : (
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {chats.map((chat) => (
              <div
                key={chat.id}
                onClick={() => handleChatClick(chat.id)}
                className="flex items-center justify-between p-2 hover:bg-accent rounded cursor-pointer"
              >
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">{chat.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(chat.updatedAt).toLocaleDateString()}
                  </div>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()}>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <DropdownMenuItem onClick={() => handleRenameChat(chat.id)}>
                      <Pencil className="h-4 w-4 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeleteChat(chat.id)} className="text-red-600 focus:text-red-600">
                      <Trash2 className="h-4 w-4 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
            
            {hasMore && (
              <div className="p-2 text-center">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="w-full"
                >
                  {loadingMore ? 'Loading...' : 'Load More Chats'}
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
};
