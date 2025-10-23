#!/bin/bash
# Auto-fix Bot 2 image sending - Run this on your VPS

cd /var/www/telegrambot

# Backup original
cp server/bot.ts server/bot.ts.backup-$(date +%s)

# Create a Python script to do the replacement
cat > /tmp/fix_bot_images.py << 'PYTHON_SCRIPT'
import re

# Read the file
with open('server/bot.ts', 'r') as f:
    content = f.read()

# The old code to replace
old_pattern = r'''    // Try to send product image if available, but don't let image failures block product display
    if \(product\.imageUrl\) \{
      try \{
        // Convert relative path to full URL for Telegram compatibility
        const baseUrl = this\.getBaseUrl\(\);
        const fullImageUrl = product\.imageUrl\.startsWith\('http'\) \? product\.imageUrl : `\$\{baseUrl\}\$\{product\.imageUrl\}`;
        
        console\.log\(`Attempting to send product image: \$\{fullImageUrl\}`\);
        
        // Get localized price for image caption
        const localizedPrice = await i18n\.getProductPrice\(userId, product\);
        
        const sentMessage = await this\.bot\?\.sendPhoto\(chatId, fullImageUrl, \{
          caption: `📦 <b>\$\{this\.escapeHtml\(product\.name\)\}</b>\\n💰 <b>\$\{this\.escapeHtml\(localizedPrice\.formattedPrice\)\}</b>`,
          parse_mode: 'HTML'
        \}\);
        
        // Add to auto-vanish tracking
        if \(sentMessage\) \{
          const userMsgIds = this\.userMessages\.get\(chatId\) \|\| \[\];
          userMsgIds\.push\(sentMessage\.message_id\);
          this\.userMessages\.set\(chatId, userMsgIds\);
          console\.log\(`\[INSTANT-VANISH\] Tracked product image message \$\{sentMessage\.message_id\} for user \$\{chatId\}`\);
        \}
      \} catch \(error\) \{
        console\.log\('Image sending failed, will show text-only product details:', error\);
        // Continue to show text details even if image fails
      \}
    \}'''

# The new code
new_code = '''    // Try to send product image if available, but don't let image failures block product display
    if (product.imageUrl) {
      try {
        // Extract imageId from URL (e.g., /api/images/product-abc123 → product-abc123)
        const imageId = product.imageUrl.replace('/api/images/', '');
        
        // Get image data from in-memory store
        const imageStore = (global as any).imageStore || new Map();
        const imageData = imageStore.get(imageId);
        
        console.log(`Attempting to send product image: ${imageId}`);
        
        // Get localized price for image caption
        const localizedPrice = await i18n.getProductPrice(userId, product);
        
        let sentMessage;
        if (imageData && imageData.data) {
          // Send image buffer directly to Telegram (works even if port is blocked)
          console.log(`Sending image buffer to Telegram (${imageData.data.length} bytes)`);
          sentMessage = await this.bot?.sendPhoto(chatId, imageData.data, {
            caption: `📦 <b>${this.escapeHtml(product.name)}</b>\\n💰 <b>${this.escapeHtml(localizedPrice.formattedPrice)}</b>`,
            parse_mode: 'HTML'
          });
        } else {
          // Fallback: If image not in memory, try URL (for external images)
          const baseUrl = this.getBaseUrl();
          const fullImageUrl = product.imageUrl.startsWith('http') ? product.imageUrl : `${baseUrl}${product.imageUrl}`;
          console.log(`Image not in memory, trying URL: ${fullImageUrl}`);
          sentMessage = await this.bot?.sendPhoto(chatId, fullImageUrl, {
            caption: `📦 <b>${this.escapeHtml(product.name)}</b>\\n💰 <b>${this.escapeHtml(localizedPrice.formattedPrice)}</b>`,
            parse_mode: 'HTML'
          });
        }
        
        // Add to auto-vanish tracking
        if (sentMessage) {
          const userMsgIds = this.userMessages.get(chatId) || [];
          userMsgIds.push(sentMessage.message_id);
          this.userMessages.set(chatId, userMsgIds);
          console.log(`[INSTANT-VANISH] Tracked product image message ${sentMessage.message_id} for user ${chatId}`);
        }
      } catch (error) {
        console.log('Image sending failed, will show text-only product details:', error);
        // Continue to show text details even if image fails
      }
    }'''

# Replace
content = re.sub(old_pattern, new_code, content, flags=re.DOTALL)

# Write back
with open('server/bot.ts', 'w') as f:
    f.write(content)

print("✅ bot.ts updated successfully!")
PYTHON_SCRIPT

# Run the Python script
python3 /tmp/fix_bot_images.py

# Rebuild Bot 2
echo "🔄 Rebuilding Bot 2..."
docker-compose up -d --build bot2

echo "✅ Done! Check logs with: docker-compose logs bot2 --tail=20"
