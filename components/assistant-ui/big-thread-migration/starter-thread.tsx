"use client";

import { useCallback, useMemo, useState, KeyboardEvent } from "react";
import { motion } from "framer-motion";
import { ArrowUpIcon, PlusIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

 const SUGGESTIONS = [
   {
     title: "What actions we can do",
     label: "using you",
     action: "What are the actions we can do using you?",
   },
   {
     title: "Write code to",
     label: "demonstrate topological sorting",
     action: "Write code to demonstrate topological sorting",
   },
   {
     title: "Help me write an essay",
     label: "about AI chat applications",
     action: "Help me write an essay about AI chat applications",
   },
   {
     title: "What is the weather",
     label: "in San Francisco?",
     action: "What is the weather in San Francisco?",
   },
 ] as const;

 type StarterThreadProps = {
   onSubmit: (prompt: string) => Promise<void> | void;
   isSubmitting?: boolean;
   error?: string | null;
 };

 export function StarterThread({
   onSubmit,
   isSubmitting = false,
   error,
 }: StarterThreadProps) {
   const [prompt, setPrompt] = useState("");
   const [localError, setLocalError] = useState<string | null>(null);

   const disabled = isSubmitting;

   const handleSubmit = useCallback(
     async (value?: string) => {
       const text = (value ?? prompt).trim();
       if (!text) {
         setLocalError("Please enter a prompt to get started.");
         return;
       }

       setLocalError(null);
       await onSubmit(text);
       setPrompt("");
     },
     [prompt, onSubmit],
   );

   const helperText = useMemo(() => {
     if (localError) return localError;
     if (error) return error;
     return null;
   }, [localError, error]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLTextAreaElement>) => {
      // Press Enter to send (Shift+Enter still adds a new line)
      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        void handleSubmit();
      }
    },
    [handleSubmit],
  );

   return (
     <div className="flex h-full flex-col">
       <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.2 }}
           className="text-3xl font-semibold"
         >
           SQL Assistant
         </motion.div>
         <motion.div
           initial={{ opacity: 0, y: 10 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ delay: 0.3 }}
           className="text-muted-foreground/65 text-2xl"
         >
           How can I help you today?
         </motion.div>
       </div>

       <div className="bg-background px-4 pb-6">
         <div className="mx-auto flex w-full max-w-[48rem] flex-col gap-4">
           <div className="grid w-full gap-2 sm:grid-cols-2">
             {SUGGESTIONS.map((suggestedAction, index) => (
               <motion.div
                 initial={{ opacity: 0, y: 20 }}
                 animate={{ opacity: 1, y: 0 }}
                 transition={{ delay: 0.05 * index }}
                 key={`starter-suggestion-${suggestedAction.title}-${index}`}
                 className="[&:nth-child(n+3)]:hidden sm:[&:nth-child(n+3)]:block"
               >
                 <Button
                   variant="ghost"
                   className="dark:hover:bg-accent/60 h-auto w-full flex-1 flex-wrap items-start justify-start gap-1 rounded-xl border px-4 py-3.5 text-left text-sm sm:flex-col"
                   aria-label={suggestedAction.action}
                   onClick={() => handleSubmit(suggestedAction.action)}
                   disabled={disabled}
                 >
                   <span className="font-medium">{suggestedAction.title}</span>
                   <p className="text-muted-foreground">{suggestedAction.label}</p>
                 </Button>
               </motion.div>
             ))}
           </div>

            <form
              className="flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                handleSubmit();
              }}
            >
              {/* Match composer sizing and shape from components/assistant-ui/thread.tsx */}
              <div className="focus-within::ring-offset-2 relative flex w-full flex-col rounded-2xl focus-within:ring-2 focus-within:ring-black dark:focus-within:ring-white">
                <textarea
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Send a message..."
                  rows={1}
                  className={cn(
                    "bg-muted border-border dark:border-muted-foreground/15 focus:outline-primary placeholder:text-muted-foreground max-h-[calc(50dvh)] min-h-16 w-full resize-none rounded-t-2xl border-x border-t px-4 pt-2 pb-3 text-base outline-none",
                    disabled && "text-muted-foreground",
                  )}
                  disabled={disabled}
                />

                <div className="bg-muted border-border dark:border-muted-foreground/15 relative flex items-center justify-between rounded-b-2xl border-x border-b p-2">
                  <Button
                    type="button"
                    variant="ghost"
                    className="hover:bg-foreground/15 dark:hover:bg-background/50 scale-115 p-3.5"
                    disabled
                    aria-label="Attachment button (coming soon)"
                  >
                    <PlusIcon className="size-4" />
                  </Button>

                  <Button
                    type="submit"
                    size="icon"
                    className="dark:border-muted-foreground/90 border-muted-foreground/60 hover:bg-primary/75 size-8 rounded-full border"
                    aria-label="Send message"
                    disabled={disabled}
                  >
                    <ArrowUpIcon className="size-5" />
                  </Button>
                </div>
              </div>

              {helperText && (
                <p className="text-sm text-destructive font-medium">{helperText}</p>
              )}
            </form>
         </div>
       </div>
     </div>
   );
 }


