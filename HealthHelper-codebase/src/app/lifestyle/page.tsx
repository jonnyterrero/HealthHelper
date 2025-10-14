"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Activity, Apple, Leaf } from "lucide-react";

// Import the content from nutrition and remedies pages
import NutritionPage from "../nutrition/page";
import RemediesPage from "../remedies/page";

export default function LifestylePage() {
  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <header className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <Button asChild variant="ghost" size="icon">
            <Link href="/">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <div className="space-y-1">
            <h1 className="text-2xl font-semibold">Lifestyle & Wellness</h1>
            <p className="text-muted-foreground">Track workouts, nutrition, and natural remedies</p>
          </div>
        </div>
      </header>

      <Tabs defaultValue="workouts" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workouts" className="flex items-center gap-2">
            <Activity className="w-4 h-4" />
            Workouts
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <Apple className="w-4 h-4" />
            Nutrition
          </TabsTrigger>
          <TabsTrigger value="remedies" className="flex items-center gap-2">
            <Leaf className="w-4 h-4" />
            Remedies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="workouts" className="mt-6">
          <Card className="border-orange-200 dark:border-orange-900/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Workout History
              </CardTitle>
              <CardDescription>
                Your exercise sessions are logged on the <Link href="/" className="text-primary underline">Home</Link> page
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                To log a new workout, go to the Home page and fill out the Workout & Activity Tracking form.
              </p>
              <div className="mt-4">
                <Button asChild>
                  <Link href="/">Go to Home Page</Link>
                </Button>
              </div>
              <div className="mt-6">
                <p className="text-sm font-medium mb-2">View your workout analytics:</p>
                <Button asChild variant="outline">
                  <Link href="/analytics">View Workout Analytics & Correlations</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="nutrition" className="mt-6">
          <NutritionPage />
        </TabsContent>

        <TabsContent value="remedies" className="mt-6">
          <RemediesPage />
        </TabsContent>
      </Tabs>
    </div>
  );
}

