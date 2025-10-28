"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Copy, Key, Webhook, ExternalLink, RefreshCw, Trash2, Smartphone, QrCode, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface ApiKey {
  id: string;
  name: string;
  key: string;
  created: string;
  lastUsed?: string;
}

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  created: string;
  status: "active" | "inactive";
}

interface ConnectedApp {
  id: string;
  name: string;
  appType: string;
  connected: string;
  lastSync?: string;
  permissions: string[];
}

export default function IntegrationsPage() {
  const [apiKeys, setApiKeys] = React.useState<ApiKey[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("orchids.apiKeys") || "[]");
    } catch {
      return [];
    }
  });

  const [webhooks, setWebhooks] = React.useState<Webhook[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("orchids.webhooks") || "[]");
    } catch {
      return [];
    }
  });

  const [connectedApps, setConnectedApps] = React.useState<ConnectedApp[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      return JSON.parse(localStorage.getItem("orchids.connectedApps") || "[]");
    } catch {
      return [];
    }
  });

  const [authCode, setAuthCode] = React.useState<string>("");
  const [showAuthDialog, setShowAuthDialog] = React.useState(false);
  const [newKeyName, setNewKeyName] = React.useState("");
  const [newWebhookName, setNewWebhookName] = React.useState("");
  const [newWebhookUrl, setNewWebhookUrl] = React.useState("");
  const [selectedEvents, setSelectedEvents] = React.useState<string[]>(["entry.created", "entry.updated"]);

  const availableEvents = [
    { id: "entry.created", label: "Entry Created" },
    { id: "entry.updated", label: "Entry Updated" },
    { id: "entry.deleted", label: "Entry Deleted" },
    { id: "insight.generated", label: "Insight Generated" },
    { id: "export.completed", label: "Export Completed" },
  ];

  function generateApiKey() {
    if (!newKeyName.trim()) {
      toast.error("Please enter a name for the API key");
      return;
    }

    const key = `orchids_${Array.from({ length: 32 }, () => 
      Math.random().toString(36)[2] || "0"
    ).join("")}`;

    const newKey: ApiKey = {
      id: crypto.randomUUID(),
      name: newKeyName,
      key,
      created: new Date().toISOString(),
    };

    const updated = [...apiKeys, newKey];
    setApiKeys(updated);
    localStorage.setItem("orchids.apiKeys", JSON.stringify(updated));
    setNewKeyName("");
    toast.success("API key generated successfully");
  }

  function deleteApiKey(id: string) {
    const updated = apiKeys.filter((k) => k.id !== id);
    setApiKeys(updated);
    localStorage.setItem("orchids.apiKeys", JSON.stringify(updated));
    toast.success("API key deleted");
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  }

  function createWebhook() {
    if (!newWebhookName.trim()) {
      toast.error("Please enter a webhook name");
      return;
    }
    if (!newWebhookUrl.trim()) {
      toast.error("Please enter a webhook URL");
      return;
    }
    if (!newWebhookUrl.startsWith("http://") && !newWebhookUrl.startsWith("https://")) {
      toast.error("Webhook URL must start with http:// or https://");
      return;
    }

    const newWebhook: Webhook = {
      id: crypto.randomUUID(),
      name: newWebhookName,
      url: newWebhookUrl,
      events: selectedEvents,
      created: new Date().toISOString(),
      status: "active",
    };

    const updated = [...webhooks, newWebhook];
    setWebhooks(updated);
    localStorage.setItem("orchids.webhooks", JSON.stringify(updated));
    setNewWebhookName("");
    setNewWebhookUrl("");
    setSelectedEvents(["entry.created", "entry.updated"]);
    toast.success("Webhook created successfully");
  }

  function deleteWebhook(id: string) {
    const updated = webhooks.filter((w) => w.id !== id);
    setWebhooks(updated);
    localStorage.setItem("orchids.webhooks", JSON.stringify(updated));
    toast.success("Webhook deleted");
  }

  function toggleWebhookStatus(id: string) {
    const updated = webhooks.map((w) =>
      w.id === id ? { ...w, status: w.status === "active" ? "inactive" : "active" } as Webhook : w
    );
    setWebhooks(updated);
    localStorage.setItem("orchids.webhooks", JSON.stringify(updated));
    toast.success("Webhook status updated");
  }

  function generateAuthCode() {
    const code = Array.from({ length: 6 }, () => 
      Math.floor(Math.random() * 10)
    ).join("");
    setAuthCode(code);
    setShowAuthDialog(true);
    
    // Store the code temporarily (expires in 10 minutes)
    const expiry = Date.now() + 10 * 60 * 1000;
    localStorage.setItem("orchids.pendingAuth", JSON.stringify({ code, expiry }));
    
    toast.success("Authorization code generated");
  }

  function disconnectApp(id: string) {
    const updated = connectedApps.filter((app) => app.id !== id);
    setConnectedApps(updated);
    localStorage.setItem("orchids.connectedApps", JSON.stringify(updated));
    toast.success("App disconnected");
  }

  const authorizationUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/api/auth/authorize?client_id=YOUR_APP_ID&redirect_uri=YOUR_CALLBACK_URL&scope=read:entries,write:entries`
    : "";

  return (
    <div className="container mx-auto max-w-6xl p-4 md:p-6 space-y-6">
      <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">Integrations</h1>
          <p className="text-sm text-muted-foreground">Connect this app with your other applications</p>
        </div>
        <Button asChild variant="outline" className="w-full sm:w-auto">
          <Link href="/">← Back to Dashboard</Link>
        </Button>
      </header>

      <div className="grid gap-6">
        {/* Mobile App Connections */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-pink-600 shrink-0" />
              <CardTitle className="text-lg">Mobile App Connections</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Connect your other health tracking PWAs (GastroGuard, Sleep Tracker, etc.) to sync data with HealthHelper
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="bg-muted/50 p-3 md:p-4 rounded-lg space-y-3">
              <h4 className="font-medium text-sm">Connect a Mobile App</h4>
              <ol className="text-xs md:text-sm space-y-2 text-muted-foreground">
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">1.</span>
                  <span>Open your other PWA (e.g., GastroGuard, Sleep Tracker)</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">2.</span>
                  <span>Go to Settings → Connect to HealthHelper</span>
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-foreground shrink-0">3.</span>
                  <span>Click "Generate Code" below and enter the 6-digit code in your app</span>
                </li>
              </ol>
              <Button 
                onClick={generateAuthCode} 
                className="w-full bg-pink-600 hover:bg-pink-700"
              >
                <QrCode className="w-4 h-4 mr-2" />
                Generate Connection Code
              </Button>
            </div>

            {connectedApps.length > 0 ? (
              <div className="space-y-3">
                {connectedApps.map((app) => (
                  <Card key={app.id}>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        <div className="space-y-2 flex-1 w-full min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <CheckCircle2 className="w-4 h-4 text-green-600 shrink-0" />
                            <h4 className="font-medium text-sm">{app.name}</h4>
                            <Badge variant="outline" className="text-xs">
                              {app.appType}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Connected {new Date(app.connected).toLocaleDateString()}
                          </p>
                          {app.lastSync && (
                            <p className="text-xs text-muted-foreground">
                              Last synced {new Date(app.lastSync).toLocaleString()}
                            </p>
                          )}
                          <div className="flex gap-1 flex-wrap">
                            {app.permissions.map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {perm}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => disconnectApp(app.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No apps connected yet. Generate a code to connect your first app.
              </p>
            )}
          </CardContent>
        </Card>

        {/* API Keys Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-pink-600 shrink-0" />
              <CardTitle className="text-lg">API Keys</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Generate API keys to access your health data programmatically
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="flex-1">
                <Input
                  placeholder="Key name (e.g., My Fitness App)"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && generateApiKey()}
                />
              </div>
              <Button onClick={generateApiKey} className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto">
                Generate Key
              </Button>
            </div>

            {apiKeys.length > 0 ? (
              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="min-w-[120px]">Name</TableHead>
                      <TableHead className="min-w-[200px]">Key</TableHead>
                      <TableHead className="min-w-[100px]">Created</TableHead>
                      <TableHead className="text-right min-w-[80px]">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {apiKeys.map((key) => (
                      <TableRow key={key.id}>
                        <TableCell className="font-medium text-sm">{key.name}</TableCell>
                        <TableCell className="font-mono text-xs">
                          <div className="flex items-center gap-2">
                            <span className="truncate">{key.key.substring(0, 20)}...</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 shrink-0"
                              onClick={() => copyToClipboard(key.key)}
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {new Date(key.created).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteApiKey(key.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No API keys yet. Generate one to get started.
              </p>
            )}

            <div className="bg-muted/50 p-3 md:p-4 rounded-lg space-y-2">
              <h4 className="font-medium text-sm">API Endpoints</h4>
              <div className="space-y-1 text-xs md:text-sm">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs shrink-0">GET</Badge>
                  <code className="break-all">/api/health/entries</code>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs shrink-0">POST</Badge>
                  <code className="break-all">/api/health/entries</code>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="text-xs shrink-0">GET</Badge>
                  <code className="break-all">/api/health/insights</code>
                </div>
              </div>
              <Button variant="link" asChild className="text-xs p-0 h-auto">
                <a href="/api/docs" target="_blank" rel="noopener noreferrer">
                  View full API documentation <ExternalLink className="w-3 h-3 ml-1" />
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Webhooks Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Webhook className="w-5 h-5 text-pink-600 shrink-0" />
              <CardTitle className="text-lg">Webhooks</CardTitle>
            </div>
            <CardDescription className="text-sm">
              Receive real-time notifications when events occur in your health app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button className="bg-pink-600 hover:bg-pink-700 w-full sm:w-auto">Create Webhook</Button>
              </DialogTrigger>
              <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle>Create New Webhook</DialogTitle>
                  <DialogDescription>
                    Configure a webhook to receive event notifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <Label>Webhook Name</Label>
                    <Input
                      placeholder="My App Webhook"
                      value={newWebhookName}
                      onChange={(e) => setNewWebhookName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Webhook URL</Label>
                    <Input
                      placeholder="https://myapp.com/webhooks/health"
                      value={newWebhookUrl}
                      onChange={(e) => setNewWebhookUrl(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Events to Subscribe</Label>
                    <div className="space-y-2">
                      {availableEvents.map((event) => (
                        <label key={event.id} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={selectedEvents.includes(event.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedEvents([...selectedEvents, event.id]);
                              } else {
                                setSelectedEvents(selectedEvents.filter((id) => id !== event.id));
                              }
                            }}
                            className="rounded border-gray-300"
                          />
                          <span className="text-sm">{event.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <Button onClick={createWebhook} className="w-full bg-pink-600 hover:bg-pink-700">
                    Create Webhook
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {webhooks.length > 0 ? (
              <div className="space-y-3">
                {webhooks.map((webhook) => (
                  <Card key={webhook.id}>
                    <CardContent className="p-3 md:p-4">
                      <div className="flex flex-col sm:flex-row items-start gap-3">
                        <div className="space-y-2 flex-1 w-full min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-medium text-sm">{webhook.name}</h4>
                            <Badge variant={webhook.status === "active" ? "default" : "secondary"} className="text-xs">
                              {webhook.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground font-mono break-all">{webhook.url}</p>
                          <div className="flex gap-1 flex-wrap">
                            {webhook.events.map((event) => (
                              <Badge key={event} variant="outline" className="text-xs">
                                {availableEvents.find((e) => e.id === event)?.label || event}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground">
                            Created {new Date(webhook.created).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex gap-2 w-full sm:w-auto">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWebhookStatus(webhook.id)}
                            className="flex-1 sm:flex-none"
                          >
                            <RefreshCw className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteWebhook(webhook.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">
                No webhooks configured. Create one to receive real-time updates.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Integration Examples */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Example Integrations</CardTitle>
            <CardDescription className="text-sm">Sample code to integrate with your apps</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Mobile App Authorization Flow</h4>
              <pre className="bg-muted p-3 rounded-lg text-[10px] md:text-xs overflow-x-auto">
{`// In your PWA (GastroGuard, Sleep Tracker, etc.)
// Step 1: User enters the 6-digit code from HealthHelper
const authCode = "123456";

// Step 2: Exchange code for access token
const response = await fetch('${authorizationUrl}', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code: authCode })
});

const { access_token } = await response.json();

// Step 3: Use token to sync data
fetch('/api/health/entries', {
  headers: { 'Authorization': \`Bearer \${access_token}\` }
});`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Fetch Health Entries (JavaScript)</h4>
              <pre className="bg-muted p-3 rounded-lg text-[10px] md:text-xs overflow-x-auto">
{`fetch('${typeof window !== "undefined" ? window.location.origin : ""}/api/health/entries', {
  headers: {
    'Authorization': 'Bearer YOUR_API_KEY',
    'Content-Type': 'application/json'
  }
})
.then(res => res.json())
.then(data => console.log(data));`}
              </pre>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Create Entry (Python)</h4>
              <pre className="bg-muted p-3 rounded-lg text-[10px] md:text-xs overflow-x-auto">
{`import requests

response = requests.post(
    '${typeof window !== "undefined" ? window.location.origin : ""}/api/health/entries',
    headers={'Authorization': 'Bearer YOUR_API_KEY'},
    json={
        'date': '2025-09-29',
        'stomach': {'severity': 5, 'notes': 'Mild discomfort'},
        'skin': {'severity': 3, 'area': 'arms'},
        'mental': {'mood': 7, 'anxiety': 4}
    }
)
print(response.json())`}
              </pre>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Authorization Code Dialog */}
      <Dialog open={showAuthDialog} onOpenChange={setShowAuthDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Connection Code</DialogTitle>
            <DialogDescription>
              Enter this code in your mobile app to connect it to HealthHelper
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="bg-muted/50 p-6 md:p-8 rounded-lg text-center">
              <p className="text-3xl md:text-4xl font-bold tracking-widest text-pink-600 mb-2">
                {authCode}
              </p>
              <p className="text-xs text-muted-foreground">
                Code expires in 10 minutes
              </p>
            </div>
            <Button 
              onClick={() => copyToClipboard(authCode)} 
              variant="outline" 
              className="w-full"
            >
              <Copy className="w-4 h-4 mr-2" />
              Copy Code
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}