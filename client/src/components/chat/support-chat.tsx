import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetFooter,
  SheetClose
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { MessagesSquare, Send, Bot, User, X } from "lucide-react";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useMutation } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai' | 'system';
  timestamp: Date;
}

interface QuickResponse {
  id: string;
  text: string;
}

export default function SupportChat() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [quickResponses, setQuickResponses] = useState<QuickResponse[]>([
    { id: '1', text: 'How do I book a turf?' },
    { id: '2', text: 'What payment methods are supported?' },
    { id: '3', text: 'How can I cancel my booking?' },
    { id: '4', text: 'What is the refund policy?' },
    { id: '5', text: 'I need help with my booking' }
  ]);
  
  // Add initial system message when chat is opened
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: Date.now().toString(),
          content: `👋 Hello${user?.username ? ` ${user.username}` : ''}! How can I help you today? Choose a question or type your own.`,
          sender: 'system',
          timestamp: new Date()
        }
      ]);
    }
  }, [isOpen, user, messages.length]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Focus input when sheet opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);
  
  // AI response mutation
  const aiResponseMutation = useMutation({
    mutationFn: async (message: string) => {
      // Call the server-side API to get a response
      const response = await apiRequest('POST', '/api/chat/support', { message });
      const data = await response.json();
      return data.response;
    },
    onSuccess: (aiResponse) => {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: aiResponse,
        sender: 'ai',
        timestamp: new Date()
      }]);
    },
    onError: (error: Error) => {
      console.error("Error getting AI response:", error);
      toast({
        title: "Could not get response",
        description: "There was an error connecting to support. Please try again.",
        variant: "destructive",
      });
      
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        content: "I'm sorry, I encountered an error. Please try again or contact support by email at support@turfbooking.com.",
        sender: 'ai',
        timestamp: new Date()
      }]);
    }
  });
  
  // Handle sending a new message
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    
    const userMessage = {
      id: Date.now().toString(),
      content: inputValue.trim(),
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue("");
    
    // Get AI response
    aiResponseMutation.mutate(userMessage.content);
  };
  
  // Handle quick response selection
  const handleQuickResponseClick = (response: QuickResponse) => {
    const userMessage = {
      id: Date.now().toString(),
      content: response.text,
      sender: 'user' as const,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    
    // Get AI response
    aiResponseMutation.mutate(userMessage.content);
  };
  
  return (
    <>
      {/* Floating Chat Button */}
      <div className="fixed bottom-6 right-6 z-50">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button 
              size="lg" 
              className="rounded-full shadow-lg h-14 w-14 p-0"
            >
              <MessagesSquare className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          
          <SheetContent side="right" className="w-[90vw] sm:w-[450px] p-0 flex flex-col">
            <SheetHeader className="border-b px-4 py-3">
              <div className="flex justify-between items-center">
                <SheetTitle className="text-left flex items-center gap-2">
                  <Bot className="h-5 w-5 text-primary" />
                  <span>TurfTime Support</span>
                </SheetTitle>
                <SheetClose asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <X className="h-4 w-4" />
                  </Button>
                </SheetClose>
              </div>
            </SheetHeader>
            
            {/* Chat Messages */}
            <ScrollArea className="flex-1 px-4 py-3">
              <div className="flex flex-col gap-3">
                <AnimatePresence initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className={cn(
                        "flex flex-col max-w-[85%] rounded-lg px-3 py-2",
                        message.sender === 'user' ? "ml-auto bg-primary text-primary-foreground" :
                        message.sender === 'system' ? "mr-auto bg-muted" :
                        "mr-auto bg-muted"
                      )}
                    >
                      <div className="flex items-center gap-1 mb-1">
                        {message.sender === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : message.sender === 'ai' ? (
                          <Bot className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">
                          {message.sender === 'user' ? 'You' : 
                           message.sender === 'system' ? 'System' : 'Support'}
                        </span>
                      </div>
                      <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
                      <span className="text-xs opacity-70 mt-1 ml-auto">
                        {new Intl.DateTimeFormat('en-US', {
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(message.timestamp))}
                      </span>
                    </motion.div>
                  ))}
                </AnimatePresence>
                
                {/* Show typing indicator when AI is responding */}
                {aiResponseMutation.isPending && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center max-w-[85%] mr-auto bg-muted rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-1">
                      <div className="typing-indicator">
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </motion.div>
                )}
                
                {/* Reference div to scroll to bottom */}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Quick Responses */}
            {messages.length <= 2 && (
              <div className="px-4 py-2 border-t">
                <p className="text-xs text-muted-foreground mb-2">Quick questions:</p>
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {quickResponses.map((response) => (
                    <Button
                      key={response.id}
                      variant="outline"
                      size="sm"
                      className="whitespace-nowrap"
                      onClick={() => handleQuickResponseClick(response)}
                    >
                      {response.text}
                    </Button>
                  ))}
                </div>
              </div>
            )}
            
            {/* Chat Input */}
            <div className="border-t p-4 mt-auto">
              <div className="flex gap-2">
                <Textarea
                  ref={inputRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 resize-none min-h-[40px] max-h-[120px]"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || aiResponseMutation.isPending}
                  className="px-3 self-end h-[40px]"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Press Enter to send, Shift+Enter for new line
              </p>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}

// Add this to your global CSS or as a style tag in the component
// Style for the typing indicator
export const chatStyles = `
.typing-indicator {
  display: flex;
  align-items: center;
}

.typing-indicator span {
  height: 8px;
  width: 8px;
  margin: 0 1px;
  background-color: #888;
  border-radius: 50%;
  display: inline-block;
  opacity: 0.4;
}

.typing-indicator span:nth-child(1) {
  animation: bounce 1s infinite;
}

.typing-indicator span:nth-child(2) {
  animation: bounce 1s infinite 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation: bounce 1s infinite 0.4s;
}

@keyframes bounce {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-5px);
  }
}

.scrollbar-none {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-none::-webkit-scrollbar {
  display: none;
}
`;