# Broadcast Testing Guide

## How to Test Broadcasts

### 1. Get Your Telegram User ID
To test broadcasts with yourself:
1. Send a message to @userinfobot on Telegram
2. It will reply with your user ID (a number like 123456789)
3. Remember this number for testing

### 2. Start Your Bot
1. Find your bot on Telegram using the username (check bot settings in admin panel)
2. Send `/start` to your bot
3. This registers you as an active user who can receive broadcasts

### 3. Test Text Broadcasts
1. Go to Bot Settings → Broadcast in the admin panel
2. Select "Custom User IDs" as target audience
3. Enter your user ID from step 1
4. Type a test message
5. Send the broadcast
6. You should receive it on Telegram

### 4. Test Image Broadcasts
1. Follow steps 1-3 above
2. Upload an image using the drag-and-drop area
3. Type a message to go with the image
4. Send the broadcast
5. You should receive both the image and text on Telegram

## Troubleshooting

### "Chat not found" error
- Make sure you've sent `/start` to your bot first
- Verify your user ID is correct
- Check that your bot token is working

### Images not sending
- Check that the image uploaded successfully (green checkmark)
- Verify the image URL is accessible
- Try with a smaller image (under 10MB)

### No users in database
- The system pulls users from order history
- For testing, use "Custom User IDs" with your own ID
- Real users need to interact with the bot first