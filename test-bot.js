// Quick test to verify the Telegram Bot functionality
// Run with: node test-bot.js

const fetch = require('node-fetch');

async function testBotEndpoints() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('🤖 Testing TeleShop Bot API endpoints...\n');

  // Test bot status
  try {
    const statusResponse = await fetch(`${baseUrl}/api/bot/status`);
    const status = await statusResponse.json();
    console.log('✅ Bot Status:', status);
  } catch (error) {
    console.error('❌ Bot Status Error:', error.message);
  }

  // Test products API
  try {
    const productsResponse = await fetch(`${baseUrl}/api/products`);
    const products = await productsResponse.json();
    console.log(`✅ Products loaded: ${products.length} items`);
    
    if (products.length > 0) {
      console.log('   Sample product:', products[0].name);
    }
  } catch (error) {
    console.error('❌ Products Error:', error.message);
  }

  // Test categories API
  try {
    const categoriesResponse = await fetch(`${baseUrl}/api/categories`);
    const categories = await categoriesResponse.json();
    console.log(`✅ Categories loaded: ${categories.length} items`);
    
    if (categories.length > 0) {
      console.log('   Sample category:', categories[0].name);
    }
  } catch (error) {
    console.error('❌ Categories Error:', error.message);
  }

  // Test featured products
  try {
    const featuredResponse = await fetch(`${baseUrl}/api/products/featured`);
    const featured = await featuredResponse.json();
    console.log(`✅ Featured products: ${featured.length} items`);
  } catch (error) {
    console.error('❌ Featured Products Error:', error.message);
  }

  // Test orders API
  try {
    const ordersResponse = await fetch(`${baseUrl}/api/orders`);
    const orders = await ordersResponse.json();
    console.log(`✅ Orders loaded: ${orders.length} items`);
  } catch (error) {
    console.error('❌ Orders Error:', error.message);
  }

  // Test bot stats
  try {
    const statsResponse = await fetch(`${baseUrl}/api/bot/stats`);
    const stats = await statsResponse.json();
    console.log('✅ Bot Stats:', {
      users: stats.totalUsers,
      orders: stats.totalOrders,
      messages: stats.totalMessages,
      revenue: `$${stats.totalRevenue}`
    });
  } catch (error) {
    console.error('❌ Bot Stats Error:', error.message);
  }

  console.log('\n🎉 Bot API test completed!');
  console.log('\n📱 Bot Commands Available:');
  console.log('   /start - Welcome message');
  console.log('   /help - Show help');
  console.log('   /catalog - Browse products');
  console.log('   /categories - View categories');
  console.log('   /featured - Featured products');
  console.log('   /search <keyword> - Search products');
  console.log('   /cart - View shopping cart');
  console.log('   /checkout - Place order');
  console.log('   /orders - Order history');
  console.log('   /contact - Contact info');
  console.log('   /payment - Payment methods');
  console.log('\n💡 To test the bot:');
  console.log('   1. Set TELEGRAM_BOT_TOKEN in environment');
  console.log('   2. Start a chat with your bot in Telegram');
  console.log('   3. Try the commands above');
}

// Run the test
testBotEndpoints().catch(console.error);