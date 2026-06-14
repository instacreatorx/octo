"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  generateChartConfig,
  generateQuery,
  runGeneratedSQLQuery,
} from "./actions";
import { Config, Result } from "@/lib/types";
import { Loader2, AlertCircle } from "lucide-react";
import { Results } from "@/components/gpt/results";
import { SuggestedQueries } from "@/components/gpt/suggested-queries";
import { QueryViewer } from "@/components/gpt/query-viewer";
import { Search } from "@/components/gpt/search";
import { Header } from "@/components/gpt/header";
import { DatabaseType } from "@/components/gpt/database-selector";

export default function GPTPage() {
  const [inputValue, setInputValue] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState<Result[]>([]);
  const [columns, setColumns] = useState<string[]>([]);
  const [activeQuery, setActiveQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<number>(0);
  const [chartConfig, setChartConfig] = useState<Config | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [databaseType, setDatabaseType] = useState<DatabaseType>("postgresql");

  const handleSubmit = async (suggestion?: string) => {
    const question = suggestion ?? inputValue;
    if (inputValue.length === 0 && !suggestion) return;
    
    clearExistingData();
    setError(null);
    if (question.trim()) {
      setSubmitted(true);
    }
    setLoading(true);
    setLoadingStep(1);
    setActiveQuery("");

    try {
      // Step 1: Generate SQL Query
      setLoadingStep(1);
      const query = await generateQuery(question, databaseType);
      if (query === undefined) {
        setError("An error occurred while generating the query. Please try again.");
        setLoading(false);
        return;
      }
      setActiveQuery(query);

      // Step 2: Run SQL Query
      setLoadingStep(2);
      const queryResults = await runGeneratedSQLQuery(query, databaseType);
      const columns = queryResults.length > 0 ? Object.keys(queryResults[0]) : [];
      setResults(queryResults);
      setColumns(columns);

      // Step 3: Generate Chart Config
      setLoadingStep(3);
      const generation = await generateChartConfig(queryResults, question);
      setChartConfig(generation.config);
      
      setLoading(false);
      setLoadingStep(0);
    } catch (e: any) {
      console.error("Error in handleSubmit:", e);
      setError(e.message || "An error occurred. Please try again.");
      setLoading(false);
      setLoadingStep(0);
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setInputValue(suggestion);
    setError(null);
    try {
      await handleSubmit(suggestion);
    } catch (e: any) {
      setError(e.message || "An error occurred. Please try again.");
    }
  };

  const clearExistingData = () => {
    setActiveQuery("");
    setResults([]);
    setColumns([]);
    setChartConfig(null);
    setError(null);
  };

  const handleClear = () => {
    setSubmitted(false);
    setInputValue("");
    clearExistingData();
  };

  const getLoadingMessage = () => {
    switch (loadingStep) {
      case 1:
        return "Generating SQL query...";
      case 2:
        return "Running SQL query...";
      case 3:
        return "Generating chart configuration...";
      default:
        return "Processing...";
    }
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900 flex items-start justify-center p-0 sm:p-8 min-h-screen">
      <div className="w-full max-w-4xl min-h-dvh sm:min-h-0 flex flex-col">
        <motion.div
          className="bg-card rounded-xl sm:border sm:border-border flex-grow flex flex-col"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
        >
          <div className="p-6 sm:p-8 flex flex-col flex-grow">
            <Header handleClear={handleClear} />
            <Search
              handleClear={handleClear}
              handleSubmit={handleSubmit}
              inputValue={inputValue}
              setInputValue={setInputValue}
              submitted={submitted}
              databaseType={databaseType}
              setDatabaseType={setDatabaseType}
            />
            <div
              id="main-container"
              className="flex-grow flex flex-col sm:min-h-[420px]"
            >
              <div className="flex-grow h-full relative">
                <AnimatePresence mode="wait">
                  {!submitted ? (
                    <SuggestedQueries
                      handleSuggestionClick={handleSuggestionClick}
                    />
                  ) : (
                    <motion.div
                      key="results"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      layout
                      className="sm:h-full min-h-[400px] flex flex-col"
                    >
                      {error && (
                        <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-3">
                          <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                          <p className="text-sm text-destructive">{error}</p>
                        </div>
                      )}
                      {activeQuery.length > 0 && (
                        <QueryViewer
                          activeQuery={activeQuery}
                          inputValue={inputValue}
                        />
                      )}
                      {loading ? (
                        <div className="h-full absolute bg-background/50 backdrop-blur-sm w-full flex flex-col items-center justify-center space-y-4 z-10">
                          <Loader2 className="h-12 w-12 animate-spin text-muted-foreground" />
                          <p className="text-foreground font-medium">
                            {getLoadingMessage()}
                          </p>
                          <div className="flex gap-2 mt-2">
                            <div
                              className={`h-2 w-2 rounded-full transition-colors ${
                                loadingStep >= 1
                                  ? "bg-primary"
                                  : "bg-muted"
                              }`}
                            />
                            <div
                              className={`h-2 w-2 rounded-full transition-colors ${
                                loadingStep >= 2
                                  ? "bg-primary"
                                  : "bg-muted"
                              }`}
                            />
                            <div
                              className={`h-2 w-2 rounded-full transition-colors ${
                                loadingStep >= 3
                                  ? "bg-primary"
                                  : "bg-muted"
                              }`}
                            />
                          </div>
                        </div>
                      ) : results.length === 0 ? (
                        <div className="flex-grow flex items-center justify-center">
                          <p className="text-center text-muted-foreground">
                            No results found.
                          </p>
                        </div>
                      ) : (
                        <Results
                          results={results}
                          chartConfig={chartConfig}
                          columns={columns}
                        />
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

