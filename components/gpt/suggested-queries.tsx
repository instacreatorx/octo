"use client";

import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface SuggestedQueriesProps {
  handleSuggestionClick: (suggestion: string) => void;
}

const suggestedQueries = [
  "Show the number of records grouped by year",
  "Display sales by month as a line chart",
  "Show the top 10 categories by count",
  "Visualize the distribution of data by category",
];

export function SuggestedQueries({
  handleSuggestionClick,
}: SuggestedQueriesProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold">Ask anything about your data</h2>
        <p className="text-muted-foreground">
          Enter a natural language query to generate SQL and visualize results
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl">
        {suggestedQueries.map((query, index) => (
          <motion.div
            key={query}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Button
              variant="outline"
              className="w-full text-left justify-start h-auto py-3 px-4 hover:bg-accent"
              onClick={() => handleSuggestionClick(query)}
            >
              {query}
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

