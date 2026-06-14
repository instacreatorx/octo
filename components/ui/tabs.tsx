"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";

export const Tabs = TabsPrimitive.Root;
export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(function TabsList({ className, ...props }, ref) {
  return (
    <TabsPrimitive.List
      ref={ref}
      className={"inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground " + (className ?? "")}
      {...props}
    />
  );
});

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(function TabsTrigger({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Trigger
      ref={ref}
      className={"inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 data-[state=active]:bg-background data-[state=active]:text-foreground " + (className ?? "")}
      {...props}
    />
  );
});

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(function TabsContent({ className, ...props }, ref) {
  return (
    <TabsPrimitive.Content
      ref={ref}
      className={"focus-visible:outline-none focus-visible:ring-2 " + (className ?? "")}
      {...props}
    />
  );
});


