"use client"

import * as React from "react"
import { Search, Lock, Clock, Calendar, CalendarDays, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface Chat {
  id: string
  title: string
  timestamp: string
  category: 'today' | 'yesterday' | 'last7days' | 'thisyear'
  excerpt?: string
}

    interface SearchModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onChatSelect?: (chatId: string) => void
}

export function SearchModal({ open, onOpenChange, onChatSelect }: SearchModalProps) {
  const [searchQuery, setSearchQuery] = React.useState("")
  const [chats, setChats] = React.useState<Chat[]>([])
  const [loading, setLoading] = React.useState(false)

  // Fetch all chats on mount
  React.useEffect(() => {
    const fetchChats = async () => {
      try {
        const token = localStorage.getItem('auth_token')
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
        const response = await fetch('/api/chats?page=1&limit=50', { headers })
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem("auth_token");
          window.location.href = '/login';
          return;
        }
        if (!response.ok) return;
        const data = await response.json()
        const formattedChats = data.chats.map((chat: any) => ({
          id: chat.id,
          title: chat.title || 'Untitled Chat',
          timestamp: formatTimestamp(chat.updatedAt),
          category: getCategory(chat.updatedAt),
          excerpt: chat._count?.messages > 0 ? `${chat._count.messages} messages` : 'No messages'
        }))
        setChats(formattedChats)
      } catch (error) {
        console.error('Failed to fetch chats:', error)
      }
    }
    fetchChats()
  }, [])

  // Search functionality
  React.useEffect(() => {
    if (!searchQuery.trim()) return

    const searchChats = async () => {
      setLoading(true)
      try {
        const token = localStorage.getItem('auth_token')
        const headers: HeadersInit = token ? { 'Authorization': `Bearer ${token}` } : {}
        const response = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`, { headers })
        if (response.status === 401) {
          // Clear invalid token and redirect to login
          localStorage.removeItem("auth_token");
          window.location.href = '/login';
          return;
        }
        if (!response.ok) return;
        const data = await response.json()
        const formattedResults = data.results.map((chat: any) => ({
          id: chat.id,
          title: chat.title,
          timestamp: formatTimestamp(chat.updatedAt),
          category: getCategory(chat.updatedAt),
          excerpt: chat.excerpt
        }))
        setChats(formattedResults)
      } catch (error) {
        console.error('Search failed:', error)
      } finally {
        setLoading(false)
      }
    }

    const timeoutId = setTimeout(searchChats, 300) // Debounce search
    return () => clearTimeout(timeoutId)
  }, [searchQuery])

  const groupedChats = React.useMemo(() => {
    const groups = {
      today: chats.filter((chat: Chat) => chat.category === 'today'),
      yesterday: chats.filter((chat: Chat) => chat.category === 'yesterday'),
      last7days: chats.filter((chat: Chat) => chat.category === 'last7days'),
      thisyear: chats.filter((chat: Chat) => chat.category === 'thisyear')
    }
    return groups
  }, [chats])

  // Helper functions
  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    if (diffInHours < 24) {
      return `${Math.floor(diffInHours)} hours ago`
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)} days ago`
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
  }

  const getCategory = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    
    // Check if it's the same day
    const isSameDay = date.toDateString() === now.toDateString()
    
    if (isSameDay) return 'today'
    if (diffInHours < 48) return 'yesterday' // Between 24-48 hours
    if (diffInHours < 168) return 'last7days' // 7 days
    return 'thisyear'
  }

  const handleChatClick = (chatId: string) => {
    onChatSelect?.(chatId)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="fixed left-[3rem] top-[2rem] right-[3rem] bottom-[2rem] w-auto h-auto max-w-none p-8 bg-sidebar border-sidebar-border rounded-3xl translate-x-0 translate-y-0">
        <DialogTitle className="sr-only">Search Chats</DialogTitle>
        <DialogHeader className="pb-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-sidebar-accent border-sidebar-border h-12 text-base"
            />
          </div>
        </DialogHeader>
        
        <div className="pb-2">
          <div className="text-sm font-medium text-sidebar-foreground mb-1">Actions</div>
          <Button
            variant="ghost"
            className="w-full justify-start gap-2 h-10 bg-sidebar-accent hover:bg-sidebar-accent/80 text-sidebar-foreground"
            onClick={() => handleChatClick('new')}
          >
            <Lock className="h-4 w-4" />
            Create New Private Chat
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="text-center py-4 text-muted-foreground">
              Searching...
            </div>
          )}
          {!loading && groupedChats.today.length > 0 && (
            <div className="pb-4">
              <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center gap-2">
                <Sun className="h-4 w-4" />
                Today
              </div>
              {groupedChats.today.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <span className="text-sidebar-foreground truncate">{chat.title}</span>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
              ))}
            </div>
          )}
          {!loading && groupedChats.yesterday.length > 0 && (
            <div className="pb-4">
              <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Yesterday
              </div>
              {groupedChats.yesterday.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <span className="text-sidebar-foreground truncate">{chat.title}</span>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && groupedChats.last7days.length > 0 && (
            <div className="pb-4">
              <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last 7 Days
              </div>
              {groupedChats.last7days.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <span className="text-sidebar-foreground truncate">{chat.title}</span>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
              ))}
            </div>
          )}

          {!loading && groupedChats.thisyear.length > 0 && (
            <div className="pb-4">
              <div className="text-sm font-medium text-sidebar-foreground mb-2 flex items-center gap-2">
                <CalendarDays className="h-4 w-4" />
                This Year
              </div>
              {groupedChats.thisyear.map((chat) => (
                <div
                  key={chat.id}
                  className="flex items-center justify-between p-2 rounded-md hover:bg-sidebar-accent cursor-pointer text-sm"
                  onClick={() => handleChatClick(chat.id)}
                >
                  <span className="text-sidebar-foreground truncate">{chat.title}</span>
                  <span className="text-xs text-muted-foreground">{chat.timestamp}</span>
                </div>
              ))}
            </div>
          )}
          {!loading && chats.length === 0 && searchQuery.trim() && (
            <div className="text-center py-8 text-muted-foreground">
              No chats found for `{searchQuery}` 
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
