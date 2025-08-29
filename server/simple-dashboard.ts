import express from 'express';
import path from 'path';
import fs from 'fs';

export function setupSimpleDashboard(app: express.Express) {
  // Serve the admin dashboard at root for easy preview access
  app.get('/', (req, res) => {
    try {
      const adminHtmlPath = path.join(__dirname, 'admin.html');
      const adminHtml = fs.readFileSync(adminHtmlPath, 'utf-8');
      res.send(adminHtml);
    } catch (error) {
      res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>TeleShop Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">🤖 TeleShop Admin Dashboard</h1>
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">System Status</h2>
            <div class="space-y-2">
                <div class="flex items-center">
                    <span class="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">Bot Online</span>
                </div>
                <p class="text-gray-600">Telegram bot is running and processing customer requests</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
                <div class="space-y-2">
                    <button onclick="loadData('/api/products')" class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">View Products</button>
                    <button onclick="loadData('/api/payment-methods')" class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">View Payment Methods</button>
                    <button onclick="loadData('/api/orders')" class="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">View Orders</button>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibent mb-4">API Response</h3>
                <div id="api-response" class="bg-gray-50 p-4 rounded text-sm font-mono max-h-64 overflow-y-auto">
                    Click a button to load data
                </div>
            </div>
        </div>
    </div>

    <script>
        async function loadData(endpoint) {
            const responseDiv = document.getElementById('api-response');
            responseDiv.textContent = 'Loading...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                responseDiv.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                responseDiv.textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
      `);
    }
  });

  // Also serve the admin dashboard at /admin for compatibility
  app.get('/admin', (req, res) => {
    try {
      const adminHtmlPath = path.join(__dirname, 'admin.html');
      const adminHtml = fs.readFileSync(adminHtmlPath, 'utf-8');
      res.send(adminHtml);
    } catch (error) {
      res.send(`
<!DOCTYPE html>
<html>
<head>
    <title>TeleShop Admin</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-gray-50 p-8">
    <div class="max-w-4xl mx-auto">
        <h1 class="text-3xl font-bold text-gray-900 mb-6">🤖 TeleShop Admin Dashboard</h1>
        <div class="bg-white rounded-lg shadow p-6 mb-6">
            <h2 class="text-xl font-semibold mb-4">System Status</h2>
            <div class="space-y-2">
                <div class="flex items-center">
                    <span class="bg-green-100 text-green-800 text-sm font-medium px-2.5 py-0.5 rounded-full">Bot Online</span>
                </div>
                <p class="text-gray-600">Telegram bot is running and processing customer requests</p>
            </div>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">Quick Actions</h3>
                <div class="space-y-2">
                    <button onclick="loadData('/api/products')" class="w-full bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded">View Products</button>
                    <button onclick="loadData('/api/payment-methods')" class="w-full bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded">View Payment Methods</button>
                    <button onclick="loadData('/api/orders')" class="w-full bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded">View Orders</button>
                </div>
            </div>
            
            <div class="bg-white rounded-lg shadow p-6">
                <h3 class="text-lg font-semibold mb-4">API Response</h3>
                <div id="api-response" class="bg-gray-50 p-4 rounded text-sm font-mono max-h-64 overflow-y-auto">
                    Click a button to load data
                </div>
            </div>
        </div>
    </div>

    <script>
        async function loadData(endpoint) {
            const responseDiv = document.getElementById('api-response');
            responseDiv.textContent = 'Loading...';
            
            try {
                const response = await fetch(endpoint);
                const data = await response.json();
                responseDiv.textContent = JSON.stringify(data, null, 2);
            } catch (error) {
                responseDiv.textContent = 'Error: ' + error.message;
            }
        }
    </script>
</body>
</html>
      `);
    }
  });
}