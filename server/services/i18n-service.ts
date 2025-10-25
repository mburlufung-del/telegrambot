import { storage } from '../storage.js';

// Message catalogs for different languages
const messageCatalogs: Record<string, Record<string, string>> = {
  en: {
    // Welcome messages
    'welcome.message': '🛍️ Welcome to TeleShop!\n\nChoose an option below:',
    'welcome.returning': '🛍️ Welcome back to TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Listings',
    'menu.carts': '🛒 Carts', 
    'menu.orders': '📦 Orders',
    'menu.wishlist': '❤️ Wishlist',
    'menu.rating': '⭐ Rating',
    'menu.operator': '👤 Operator',
    'menu.back': '🔙 Back to Menu',
    'menu.settings': '⚙️ Settings',
    'menu.language': '🌐 Language',
    'menu.currency': '💱 Currency',
    
    // Listings
    'listings.title': '📋 *Choose Product Category:*',
    'listings.no_products': '📋 No products available at the moment.\n\nCome back later for new listings!',
    'listings.category_products': '{name} ({count} products)',
    
    // Cart
    'cart.title': '🛒 *Your Shopping Cart*',
    'cart.empty': 'Your cart is empty. Start shopping to add items!',
    'cart.total': '💰 *Total: {total}*',
    'cart.checkout_ready': '🚀 *Ready to checkout?*\nComplete your order with delivery, payment, and contact options.',
    'cart.proceed_checkout': '🛒 Proceed to Checkout',
    'cart.clear_cart': '🔄 Clear Cart',
    'cart.quantity': 'Qty: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Add to Cart',
    'product.add_to_wishlist': '❤️ Add to Wishlist',
    'product.rate_product': '⭐ Rate Product',
    'product.stock': 'Stock: {stock}',
    'product.price': 'Price: {price}',
    'product.out_of_stock': '❌ Out of Stock',
    'product.added_to_cart': '✅ Added to cart: {product}',
    'product.added_to_wishlist': '✅ Added to wishlist: {product}',
    
    // Orders
    'orders.title': '📦 *Your Orders*',
    'orders.no_orders': 'No orders yet. Make your first purchase!',
    'orders.order_number': 'Order {number}',
    'orders.status': 'Status: {status}',
    'orders.total': 'Total: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Checkout Process*',
    'checkout.delivery_method': 'Choose delivery method:',
    'checkout.payment_method': 'Choose payment method:',
    'checkout.confirm_order': '✅ Confirm Order',
    'checkout.order_confirmed': '✅ Order confirmed! Order number: {orderNumber}',
    
    // Support
    'support.title': '👤 *Customer Support*',
    'support.options': 'How can we help you?',
    'support.send_message': '💬 Send Message',
    'support.email_support': '📧 Email Support', 
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Settings*',
    'settings.language_title': '🌐 *Choose Language:*',
    'settings.currency_title': '💱 *Choose Currency:*',
    'settings.language_changed': '✅ Language changed to {language}',
    'settings.currency_changed': '✅ Currency changed to {currency}',
    'settings.language_current': 'Current language: {language}',
    'settings.currency_current': 'Current currency: {currency}',
    
    // Common actions
    'action.back': '🔙 Back',
    'action.cancel': '❌ Cancel',
    'action.confirm': '✅ Confirm',
    'action.continue': '➡️ Continue',
    'action.save': '💾 Save',
    
    // Button labels
    'button.main_menu': '🏠 Main Menu',
    'button.back_to_menu': '🔙 Back to Menu',
    'button.view_orders': '📦 View My Orders',
    'button.contact_support': '👤 Contact Support',
    'button.live_chat': '💬 Live Chat with Operator',
    'button.submit_inquiry': '📋 Submit Support Inquiry',
    'button.email_support': '📧 Email Support',
    'button.send_message': '💬 Send Message Instead',
    'button.back_operator': '🔙 Back to Operator Menu',
    'button.listings': '📋 Listings',
    'button.view_cart': '🛒 View Cart',
    'button.add_to_cart': '🛒 Add to Cart',
    'button.add_to_wishlist': '❤️ Add to Wishlist',
    'button.rate_product': '⭐ Rate Product',
    'button.view_session': '📋 View Session',
    'button.end_session': '❌ End Session',
    
    // Error messages
    'error.general': '❌ An error occurred. Please try again.',
    'error.product_not_found': '❌ Product not found.',
    'error.out_of_stock': '❌ Product is out of stock.',
    'error.invalid_quantity': '❌ Invalid quantity.',
    'error.cart_load_failed': '🛒 <b>Your Shopping Cart</b>\n\nUnable to load cart. Please try again.',
    'error.orders_load_failed': '📦 <b>Your Orders</b>\n\nUnable to load orders. Please try again.',
    'error.cart_empty_checkout': '🛒 Your cart is empty. Add items before checkout.',
    'error.no_cart_items': '🛒 No items in cart to checkout.',
    
    // Success messages
    'success.cart_cleared': '✅ Cart cleared successfully.',
    'success.item_removed': '✅ Item removed from cart.',
    'success.order_placed': '✅ Order placed successfully!',
    
    // Welcome and default messages
    'welcome.default': '🎉 Welcome {username} to our Shop!\n\n🛍️ <b>Your one-stop destination for amazing products</b>\n\nUse the buttons below to explore our catalog, manage your cart, or get support.',
    
    // Operator/Support detailed messages
    'operator.contact_title': '👤 <b>Contact Operator</b>',
    'operator.need_help': 'Need help? Our support team is here for you!',
    'operator.support_contact': '📞 <b>Support Contact:</b>',
    'operator.telegram': '• Telegram: {contact}',
    'operator.email': '• Email: {email}',
    'operator.business_hours': '🕒 <b>Business Hours:</b>\n{hours}',
    'operator.quick_help': '💬 <b>For Quick Help:</b>',
    'operator.order_issues': '• Order issues: Reply with your order number',
    'operator.product_questions': '• Product questions: Ask about specific items',
    'operator.technical_support': '• Technical support: Describe your problem',
    'operator.response_time': '⚡ <b>Average Response Time:</b> {time}',
    
    // Live support session
    'support.session_title': '💬 <b>Start Live Support Session</b>',
    'support.session_description': 'Please describe your issue or question. An operator will be assigned to help you.',
    'support.categories_title': '<b>Categories:</b>',
    'support.category_general': '• General questions',
    'support.category_order': '• Order inquiries',
    'support.category_product': '• Product support',
    'support.category_payment': '• Payment issues',
    'support.category_delivery': '• Delivery questions',
    'support.type_message': 'Type your message below:',
    'support.back_to_options': '🔙 Back to Support Options',
    'support.session_created': '✅ <b>Support Session Created</b>',
    'support.session_id': 'Session ID: `{id}`',
    'support.session_status_waiting': 'Status: ⏳ Waiting for operator',
    'support.session_priority': 'Priority: {priority}',
    'support.your_request': 'Your request: "{message}"',
    'support.notification_pending': 'You will be notified when an operator is assigned to your session.',
    'support.session_ended': '✅ <b>Support Session Ended</b>',
    'support.session_status_resolved': 'Status: Resolved',
    'support.thank_you': 'Thank you for using our support service!',
    
    // FAQ
    'faq.title': '❓ <b>Frequently Asked Questions</b>',
    'faq.ordering_title': '🛒 Ordering:',
    'faq.how_to_order_q': '• Q: How do I place an order?',
    'faq.how_to_order_a': '• A: Browse products, add to cart, then checkout',
    'faq.modify_order_q': '• Q: Can I modify my order?',
    'faq.modify_order_a': '• A: Contact support within 1 hour of ordering',
    'faq.shipping_title': '📦 Shipping:',
    'faq.shipping_time_q': '• Q: How long does shipping take?',
    'faq.shipping_time_a': '• A: 3-7 business days for standard shipping',
    'faq.international_q': '• Q: Do you ship internationally?',
    'faq.international_a': '• A: Currently shipping within the US only',
    'faq.payment_title': '💳 Payment:',
    'faq.payment_methods_q': '• Q: What payment methods do you accept?',
    'faq.payment_methods_a': '• A: Credit cards, PayPal, bank transfer, and crypto',
    'faq.returns_title': '🔄 Returns:',
    'faq.return_policy_q': '• Q: What\'s your return policy?',
    'faq.return_policy_a': '• A: 30-day returns for unopened products',
    'faq.technical_title': '📱 Technical:',
    'faq.bot_not_responding_q': '• Q: Bot not responding?',
    'faq.bot_not_responding_a': '• A: Try /start command or contact support',
    'faq.need_more_help': 'Need more help? Contact our support team!',
    
    // Support inquiry confirmation
    'support.inquiry_received': '✅ <b>Support Request Received</b>',
    'support.inquiry_response_time': 'Your support request has been received. Our team will respond within {time}.',
    'support.inquiry_your_message': 'Your message: "{message}"',
    'support.inquiry_contact_directly': 'Contact {contact} directly: You can also message {contact} on Telegram{usernameInfo}',
    'support.inquiry_with_username': ' mentioning your username @{username}',
    'support.inquiry_with_userid': ' with your User ID: {userId}',
    'support.inquiry_ticket_id': 'Ticket ID: #{ticketId}',
    'support.inquiry_continue_shopping': 'You can continue shopping while we prepare your response.',
    
    // Checkout messages
    'checkout.delivery_title': '🚚 <b>Delivery Information</b>',
    'checkout.order_number_label': '<b>Order Number:</b> {orderNumber}',
    'checkout.selected_delivery': 'Selected: {name} ({time})',
    'checkout.delivery_cost': 'Cost: {cost}',
    'checkout.delivery_free': 'Free',
    'checkout.address_format_title': 'Please provide your information in this format:',
    'checkout.required_format': '📝 Required Format:',
    'checkout.format_fullname': 'Full Name',
    'checkout.format_phone': 'Phone Number',
    'checkout.format_street': 'Street Address',
    'checkout.format_city': 'City, State ZIP',
    'checkout.format_country': 'Country',
    'checkout.example_title': 'Example:',
    'checkout.example_name': 'John Smith',
    'checkout.example_phone': '+1 (555) 123-4567',
    'checkout.example_street': '123 Main Street',
    'checkout.example_city': 'New York, NY 10001',
    'checkout.example_country': 'United States',
    
    // Order confirmation
    'order.confirmation_title': '✅ <b>Order Confirmed!</b>',
    'order.thank_you': 'Thank you for your order!',
    'order.customer_id': '<b>Customer ID:</b> {userId}',
    'order.total_label': '<b>Total:</b> {total}',
    'order.status_label': '<b>Status:</b> Completed',
    'order.next_steps': '📋 <b>Next Steps:</b>',
    'order.step_payment': '1. Payment verification (if applicable)',
    'order.step_processing': '2. Order processing (1-2 business days)',
    'order.step_shipping': '3. Shipping/Pickup preparation',
    'order.step_tracking': '4. Delivery tracking info',
    'order.support_contact_label': '📞 <b>Support Contact:</b>',
    'order.include_order_number': '• Include your order number: {orderNumber}',
    'order.estimated_processing': '<b>Estimated Processing:</b> 1-2 business days',
    'order.thank_you_shopping': 'Thank you for shopping with us! 🛍️',
    
    // Cart actions
    'cart.cleared_title': '🗑️ <b>Cart Cleared</b>',
    'cart.cleared_message': 'All items have been removed from your cart.',
  },
  
  es: {
    // Welcome messages
    'welcome.message': '🛍️ ¡Bienvenido a TeleShop!\n\nElige una opción:',
    'welcome.returning': '🛍️ ¡Bienvenido de nuevo a TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Productos',
    'menu.carts': '🛒 Carrito',
    'menu.orders': '📦 Pedidos',
    'menu.wishlist': '❤️ Lista de deseos',
    'menu.rating': '⭐ Valoraciones',
    'menu.operator': '👤 Operador',
    'menu.back': '🔙 Volver al Menú',
    'menu.settings': '⚙️ Configuración',
    'menu.language': '🌐 Idioma',
    'menu.currency': '💱 Moneda',
    
    // Listings
    'listings.title': '📋 *Elige Categoría de Producto:*',
    'listings.no_products': '📋 No hay productos disponibles en este momento.\n\n¡Vuelve más tarde para nuevos productos!',
    'listings.category_products': '{name} ({count} productos)',
    
    // Cart
    'cart.title': '🛒 *Tu Carrito de Compras*',
    'cart.empty': 'Tu carrito está vacío. ¡Empieza a comprar para agregar productos!',
    'cart.total': '💰 *Total: {total}*',
    'cart.checkout_ready': '🚀 *¿Listo para pagar?*\nCompleta tu pedido con opciones de entrega, pago y contacto.',
    'cart.proceed_checkout': '🛒 Proceder al Pago',
    'cart.clear_cart': '🔄 Limpiar Carrito',
    'cart.quantity': 'Cant: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Añadir al Carrito',
    'product.add_to_wishlist': '❤️ Añadir a Lista de Deseos',
    'product.rate_product': '⭐ Valorar Producto',
    'product.stock': 'Stock: {stock}',
    'product.price': 'Precio: {price}',
    'product.out_of_stock': '❌ Sin Stock',
    'product.added_to_cart': '✅ Añadido al carrito: {product}',
    'product.added_to_wishlist': '✅ Añadido a lista de deseos: {product}',
    
    // Orders
    'orders.title': '📦 *Tus Pedidos*',
    'orders.no_orders': 'Aún no tienes pedidos. ¡Haz tu primera compra!',
    'orders.order_number': 'Pedido {number}',
    'orders.status': 'Estado: {status}',
    'orders.total': 'Total: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Proceso de Pago*',
    'checkout.delivery_method': 'Elige método de entrega:',
    'checkout.payment_method': 'Elige método de pago:',
    'checkout.confirm_order': '✅ Confirmar Pedido',
    'checkout.order_confirmed': '✅ ¡Pedido confirmado! Número de pedido: {orderNumber}',
    
    // Support
    'support.title': '👤 *Atención al Cliente*',
    'support.options': '¿Cómo podemos ayudarte?',
    'support.send_message': '💬 Enviar Mensaje',
    'support.email_support': '📧 Soporte por Email',
    'support.faq': '❓ Preguntas Frecuentes',
    
    // Settings
    'settings.title': '⚙️ *Configuración*',
    'settings.language_title': '🌐 *Elegir Idioma:*',
    'settings.currency_title': '💱 *Elegir Moneda:*',
    'settings.language_changed': '✅ Idioma cambiado a {language}',
    'settings.currency_changed': '✅ Moneda cambiada a {currency}',
    'settings.language_current': 'Idioma actual: {language}',
    'settings.currency_current': 'Moneda actual: {currency}',
    
    // Common actions
    'action.back': '🔙 Atrás',
    'action.cancel': '❌ Cancelar',
    'action.confirm': '✅ Confirmar',
    'action.continue': '➡️ Continuar',
    'action.save': '💾 Guardar',
    
    // Button labels
    'button.main_menu': '🏠 Menú Principal',
    'button.back_to_menu': '🔙 Volver al Menú',
    'button.view_orders': '📦 Ver Mis Pedidos',
    'button.contact_support': '👤 Contactar Soporte',
    'button.live_chat': '💬 Chat en Vivo con Operador',
    'button.submit_inquiry': '📋 Enviar Consulta de Soporte',
    'button.email_support': '📧 Soporte por Email',
    'button.send_message': '💬 Enviar Mensaje en su Lugar',
    'button.back_operator': '🔙 Volver al Menú de Operador',
    'button.listings': '📋 Listados',
    'button.view_cart': '🛒 Ver Carrito',
    'button.add_to_cart': '🛒 Añadir al Carrito',
    'button.add_to_wishlist': '❤️ Añadir a Lista de Deseos',
    'button.rate_product': '⭐ Valorar Producto',
    'button.view_session': '📋 Ver Sesión',
    'button.end_session': '❌ Finalizar Sesión',
    
    // Error messages
    'error.general': '❌ Ocurrió un error. Por favor, inténtalo de nuevo.',
    'error.product_not_found': '❌ Producto no encontrado.',
    'error.out_of_stock': '❌ Producto sin stock.',
    'error.invalid_quantity': '❌ Cantidad inválida.',
    
    // Success messages
    'success.cart_cleared': '✅ Carrito limpiado exitosamente.',
    'success.item_removed': '✅ Producto eliminado del carrito.',
    'success.order_placed': '✅ ¡Pedido realizado exitosamente!',
    
    // Welcome and default messages
    'welcome.default': '🎉 ¡Bienvenido {username} a nuestra Tienda!\n\n🛍️ <b>Tu destino único para productos increíbles</b>\n\nUsa los botones de abajo para explorar nuestro catálogo, gestionar tu carrito u obtener soporte.',
    
    // Operator/Support detailed messages
    'operator.contact_title': '👤 <b>Contactar Operador</b>',
    'operator.need_help': '¿Necesitas ayuda? ¡Nuestro equipo de soporte está aquí para ti!',
    'operator.support_contact': '📞 <b>Contacto de Soporte:</b>',
    'operator.telegram': '• Telegram: {contact}',
    'operator.email': '• Email: {email}',
    'operator.business_hours': '🕒 <b>Horario Comercial:</b>\n{hours}',
    'operator.quick_help': '💬 <b>Para Ayuda Rápida:</b>',
    'operator.order_issues': '• Problemas con pedidos: Responde con tu número de pedido',
    'operator.product_questions': '• Preguntas sobre productos: Pregunta sobre artículos específicos',
    'operator.technical_support': '• Soporte técnico: Describe tu problema',
    'operator.response_time': '⚡ <b>Tiempo Promedio de Respuesta:</b> {time}',
    
    // Live support session
    'support.session_title': '💬 <b>Iniciar Sesión de Soporte en Vivo</b>',
    'support.session_description': 'Por favor describe tu problema o pregunta. Un operador será asignado para ayudarte.',
    'support.categories_title': '<b>Categorías:</b>',
    'support.category_general': '• Preguntas generales',
    'support.category_order': '• Consultas de pedidos',
    'support.category_product': '• Soporte de productos',
    'support.category_payment': '• Problemas de pago',
    'support.category_delivery': '• Preguntas sobre entrega',
    'support.type_message': 'Escribe tu mensaje a continuación:',
    'support.back_to_options': '🔙 Volver a Opciones de Soporte',
    'support.session_created': '✅ <b>Sesión de Soporte Creada</b>',
    'support.session_id': 'ID de Sesión: `{id}`',
    'support.session_status_waiting': 'Estado: ⏳ Esperando operador',
    'support.session_priority': 'Prioridad: {priority}',
    'support.your_request': 'Tu solicitud: "{message}"',
    'support.notification_pending': 'Serás notificado cuando un operador sea asignado a tu sesión.',
    'support.session_ended': '✅ <b>Sesión de Soporte Finalizada</b>',
    'support.session_status_resolved': 'Estado: Resuelto',
    'support.thank_you': '¡Gracias por usar nuestro servicio de soporte!',
    
    // FAQ
    'faq.title': '❓ <b>Preguntas Frecuentes</b>',
    'faq.ordering_title': '🛒 Pedidos:',
    'faq.how_to_order_q': '• P: ¿Cómo hago un pedido?',
    'faq.how_to_order_a': '• R: Navega productos, añade al carrito, luego finaliza compra',
    'faq.modify_order_q': '• P: ¿Puedo modificar mi pedido?',
    'faq.modify_order_a': '• R: Contacta soporte dentro de 1 hora después de ordenar',
    'faq.shipping_title': '📦 Envío:',
    'faq.shipping_time_q': '• P: ¿Cuánto tarda el envío?',
    'faq.shipping_time_a': '• R: 3-7 días hábiles para envío estándar',
    'faq.international_q': '• P: ¿Envían internacionalmente?',
    'faq.international_a': '• R: Actualmente solo enviamos dentro de EE.UU.',
    'faq.payment_title': '💳 Pago:',
    'faq.payment_methods_q': '• P: ¿Qué métodos de pago aceptan?',
    'faq.payment_methods_a': '• R: Tarjetas de crédito, PayPal, transferencia bancaria y cripto',
    'faq.returns_title': '🔄 Devoluciones:',
    'faq.return_policy_q': '• P: ¿Cuál es su política de devoluciones?',
    'faq.return_policy_a': '• R: Devoluciones de 30 días para productos sin abrir',
    'faq.technical_title': '📱 Técnico:',
    'faq.bot_not_responding_q': '• P: ¿El bot no responde?',
    'faq.bot_not_responding_a': '• R: Prueba el comando /start o contacta soporte',
    'faq.need_more_help': '¿Necesitas más ayuda? ¡Contacta nuestro equipo de soporte!',
    
    // Support inquiry confirmation
    'support.inquiry_received': '✅ <b>Solicitud de Soporte Recibida</b>',
    'support.inquiry_response_time': 'Tu solicitud de soporte ha sido recibida. Nuestro equipo responderá dentro de {time}.',
    'support.inquiry_your_message': 'Tu mensaje: "{message}"',
    'support.inquiry_contact_directly': 'Contacta {contact} directamente: También puedes enviar mensaje a {contact} en Telegram{usernameInfo}',
    'support.inquiry_with_username': ' mencionando tu nombre de usuario @{username}',
    'support.inquiry_with_userid': ' con tu ID de Usuario: {userId}',
    'support.inquiry_ticket_id': 'ID de Ticket: #{ticketId}',
    'support.inquiry_continue_shopping': 'Puedes continuar comprando mientras preparamos tu respuesta.',
    
    // Checkout messages
    'checkout.delivery_title': '🚚 <b>Información de Entrega</b>',
    'checkout.order_number_label': '<b>Número de Pedido:</b> {orderNumber}',
    'checkout.selected_delivery': 'Seleccionado: {name} ({time})',
    'checkout.delivery_cost': 'Costo: {cost}',
    'checkout.delivery_free': 'Gratis',
    'checkout.address_format_title': 'Por favor proporciona tu información en este formato:',
    'checkout.required_format': '📝 Formato Requerido:',
    'checkout.format_fullname': 'Nombre Completo',
    'checkout.format_phone': 'Número de Teléfono',
    'checkout.format_street': 'Dirección de Calle',
    'checkout.format_city': 'Ciudad, Estado CP',
    'checkout.format_country': 'País',
    'checkout.example_title': 'Ejemplo:',
    'checkout.example_name': 'Juan García',
    'checkout.example_phone': '+34 (612) 345-678',
    'checkout.example_street': 'Calle Principal 123',
    'checkout.example_city': 'Madrid, MD 28001',
    'checkout.example_country': 'España',
    
    // Order confirmation
    'order.confirmation_title': '✅ <b>¡Pedido Confirmado!</b>',
    'order.thank_you': '¡Gracias por tu pedido!',
    'order.customer_id': '<b>ID de Cliente:</b> {userId}',
    'order.total_label': '<b>Total:</b> {total}',
    'order.status_label': '<b>Estado:</b> Completado',
    'order.next_steps': '📋 <b>Próximos Pasos:</b>',
    'order.step_payment': '1. Verificación de pago (si aplica)',
    'order.step_processing': '2. Procesamiento del pedido (1-2 días hábiles)',
    'order.step_shipping': '3. Preparación de envío/recogida',
    'order.step_tracking': '4. Información de seguimiento de entrega',
    'order.support_contact_label': '📞 <b>Contacto de Soporte:</b>',
    'order.include_order_number': '• Incluye tu número de pedido: {orderNumber}',
    'order.estimated_processing': '<b>Procesamiento Estimado:</b> 1-2 días hábiles',
    'order.thank_you_shopping': '¡Gracias por comprar con nosotros! 🛍️',
    
    // Cart actions
    'cart.cleared_title': '🗑️ <b>Carrito Limpiado</b>',
    'cart.cleared_message': 'Todos los artículos han sido eliminados de tu carrito.',
  },
  
  fr: {
    // Welcome messages
    'welcome.message': '🛍️ Bienvenue sur TeleShop !\n\nChoisissez une option ci-dessous :',
    'welcome.returning': '🛍️ Bon retour sur TeleShop !',
    
    // Main menu
    'menu.listings': '📋 Produits',
    'menu.carts': '🛒 Panier',
    'menu.orders': '📦 Commandes',
    'menu.wishlist': '❤️ Liste de souhaits',
    'menu.rating': '⭐ Évaluations',
    'menu.operator': '👤 Opérateur',
    'menu.back': '🔙 Retour au Menu',
    'menu.settings': '⚙️ Paramètres',
    'menu.language': '🌐 Langue',
    'menu.currency': '💱 Devise',
    
    // Listings
    'listings.title': '📋 *Choisir une Catégorie de Produit :*',
    'listings.no_products': '📋 Aucun produit disponible pour le moment.\n\nRevenez plus tard pour de nouveaux produits !',
    'listings.category_products': '{name} ({count} produits)',
    
    // Cart
    'cart.title': '🛒 *Votre Panier*',
    'cart.empty': 'Votre panier est vide. Commencez vos achats pour ajouter des articles !',
    'cart.total': '💰 *Total : {total}*',
    'cart.checkout_ready': '🚀 *Prêt à commander ?*\nFinalisez votre commande avec les options de livraison, paiement et contact.',
    'cart.proceed_checkout': '🛒 Procéder au Paiement',
    'cart.clear_cart': '🔄 Vider le Panier',
    'cart.quantity': 'Qté : {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Ajouter au Panier',
    'product.add_to_wishlist': '❤️ Ajouter à la Liste de Souhaits',
    'product.rate_product': '⭐ Évaluer le Produit',
    'product.stock': 'Stock : {stock}',
    'product.price': 'Prix : {price}',
    'product.out_of_stock': '❌ Rupture de Stock',
    'product.added_to_cart': '✅ Ajouté au panier : {product}',
    'product.added_to_wishlist': '✅ Ajouté à la liste de souhaits : {product}',
    
    // Orders
    'orders.title': '📦 *Vos Commandes*',
    'orders.no_orders': 'Aucune commande pour le moment. Effectuez votre premier achat !',
    'orders.order_number': 'Commande {number}',
    'orders.status': 'Statut : {status}',
    'orders.total': 'Total : {total}',
    
    // Checkout
    'checkout.title': '🛒 *Processus de Commande*',
    'checkout.delivery_method': 'Choisir le mode de livraison :',
    'checkout.payment_method': 'Choisir le mode de paiement :',
    'checkout.confirm_order': '✅ Confirmer la Commande',
    'checkout.order_confirmed': '✅ Commande confirmée ! Numéro de commande : {orderNumber}',
    
    // Support
    'support.title': '👤 *Support Client*',
    'support.options': 'Comment pouvons-nous vous aider ?',
    'support.send_message': '💬 Envoyer un Message',
    'support.email_support': '📧 Support par Email',
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Paramètres*',
    'settings.language_title': '🌐 *Choisir la Langue :*',
    'settings.currency_title': '💱 *Choisir la Devise :*',
    'settings.language_changed': '✅ Langue changée pour {language}',
    'settings.currency_changed': '✅ Devise changée pour {currency}',
    'settings.language_current': 'Langue actuelle : {language}',
    'settings.currency_current': 'Devise actuelle : {currency}',
    
    // Common actions
    'action.back': '🔙 Retour',
    'action.cancel': '❌ Annuler',
    'action.confirm': '✅ Confirmer',
    'action.continue': '➡️ Continuer',
    'action.save': '💾 Sauvegarder',
    
    // Button labels
    'button.main_menu': '🏠 Menu Principal',
    'button.back_to_menu': '🔙 Retour au Menu',
    'button.view_orders': '📦 Voir Mes Commandes',
    'button.contact_support': '👤 Contacter le Support',
    'button.live_chat': '💬 Chat en Direct avec Opérateur',
    'button.submit_inquiry': '📋 Soumettre une Demande de Support',
    'button.email_support': '📧 Support par Email',
    'button.send_message': '💬 Envoyer un Message à la Place',
    'button.back_operator': '🔙 Retour au Menu Opérateur',
    'button.listings': '📋 Annonces',
    'button.view_cart': '🛒 Voir le Panier',
    'button.add_to_cart': '🛒 Ajouter au Panier',
    'button.add_to_wishlist': '❤️ Ajouter aux Favoris',
    'button.rate_product': '⭐ Noter le Produit',
    'button.view_session': '📋 Voir la Session',
    'button.end_session': '❌ Terminer la Session',
    
    // Error messages
    'error.general': '❌ Une erreur s\'est produite. Veuillez réessayer.',
    'error.product_not_found': '❌ Produit non trouvé.',
    'error.out_of_stock': '❌ Produit en rupture de stock.',
    'error.invalid_quantity': '❌ Quantité invalide.',
    
    // Success messages
    'success.cart_cleared': '✅ Panier vidé avec succès.',
    'success.item_removed': '✅ Article retiré du panier.',
    'success.order_placed': '✅ Commande passée avec succès !',
    
    // Welcome and default messages
    'welcome.default': '🎉 Bienvenue {username} dans notre Boutique !\n\n🛍️ <b>Votre destination unique pour des produits extraordinaires</b>\n\nUtilisez les boutons ci-dessous pour explorer notre catalogue, gérer votre panier ou obtenir de l\'aide.',
    
    // Operator/Support detailed messages
    'operator.contact_title': '👤 <b>Contacter un Opérateur</b>',
    'operator.need_help': 'Besoin d\'aide ? Notre équipe d\'assistance est là pour vous !',
    'operator.support_contact': '📞 <b>Contact Assistance :</b>',
    'operator.telegram': '• Telegram : {contact}',
    'operator.email': '• Email : {email}',
    'operator.business_hours': '🕒 <b>Horaires d\'Ouverture :</b>\n{hours}',
    'operator.quick_help': '💬 <b>Pour une Aide Rapide :</b>',
    'operator.order_issues': '• Problèmes de commande : Répondez avec votre numéro de commande',
    'operator.product_questions': '• Questions sur les produits : Posez vos questions sur des articles spécifiques',
    'operator.technical_support': '• Support technique : Décrivez votre problème',
    'operator.response_time': '⚡ <b>Temps de Réponse Moyen :</b> {time}',
    
    // Live support session
    'support.session_title': '💬 <b>Démarrer une Session d\'Assistance en Direct</b>',
    'support.session_description': 'Veuillez décrire votre problème ou votre question. Un opérateur sera assigné pour vous aider.',
    'support.categories_title': '<b>Catégories :</b>',
    'support.category_general': '• Questions générales',
    'support.category_order': '• Demandes de commandes',
    'support.category_product': '• Support produits',
    'support.category_payment': '• Problèmes de paiement',
    'support.category_delivery': '• Questions de livraison',
    'support.type_message': 'Tapez votre message ci-dessous :',
    'support.back_to_options': '🔙 Retour aux Options d\'Assistance',
    'support.session_created': '✅ <b>Session d\'Assistance Créée</b>',
    'support.session_id': 'ID de Session : `{id}`',
    'support.session_status_waiting': 'Statut : ⏳ En attente d\'un opérateur',
    'support.session_priority': 'Priorité : {priority}',
    'support.your_request': 'Votre demande : "{message}"',
    'support.notification_pending': 'Vous serez notifié lorsqu\'un opérateur sera assigné à votre session.',
    'support.session_ended': '✅ <b>Session d\'Assistance Terminée</b>',
    'support.session_status_resolved': 'Statut : Résolu',
    'support.thank_you': 'Merci d\'avoir utilisé notre service d\'assistance !',
    
    // FAQ
    'faq.title': '❓ <b>Questions Fréquemment Posées</b>',
    'faq.ordering_title': '🛒 Commandes :',
    'faq.how_to_order_q': '• Q : Comment passer une commande ?',
    'faq.how_to_order_a': '• R : Parcourez les produits, ajoutez au panier, puis finalisez',
    'faq.modify_order_q': '• Q : Puis-je modifier ma commande ?',
    'faq.modify_order_a': '• R : Contactez le support dans l\'heure suivant la commande',
    'faq.shipping_title': '📦 Livraison :',
    'faq.shipping_time_q': '• Q : Combien de temps prend la livraison ?',
    'faq.shipping_time_a': '• R : 3-7 jours ouvrables pour la livraison standard',
    'faq.international_q': '• Q : Livrez-vous à l\'international ?',
    'faq.international_a': '• R : Actuellement, livraison uniquement aux États-Unis',
    'faq.payment_title': '💳 Paiement :',
    'faq.payment_methods_q': '• Q : Quels modes de paiement acceptez-vous ?',
    'faq.payment_methods_a': '• R : Cartes de crédit, PayPal, virement bancaire et crypto',
    'faq.returns_title': '🔄 Retours :',
    'faq.return_policy_q': '• Q : Quelle est votre politique de retour ?',
    'faq.return_policy_a': '• R : Retours de 30 jours pour les produits non ouverts',
    'faq.technical_title': '📱 Technique :',
    'faq.bot_not_responding_q': '• Q : Le bot ne répond pas ?',
    'faq.bot_not_responding_a': '• R : Essayez la commande /start ou contactez le support',
    'faq.need_more_help': 'Besoin de plus d\'aide ? Contactez notre équipe d\'assistance !',
    
    // Support inquiry confirmation
    'support.inquiry_received': '✅ <b>Demande d\'Assistance Reçue</b>',
    'support.inquiry_response_time': 'Votre demande d\'assistance a été reçue. Notre équipe répondra dans {time}.',
    'support.inquiry_your_message': 'Votre message : "{message}"',
    'support.inquiry_contact_directly': 'Contactez {contact} directement : Vous pouvez également envoyer un message à {contact} sur Telegram{usernameInfo}',
    'support.inquiry_with_username': ' en mentionnant votre nom d\'utilisateur @{username}',
    'support.inquiry_with_userid': ' avec votre ID utilisateur : {userId}',
    'support.inquiry_ticket_id': 'ID de Ticket : #{ticketId}',
    'support.inquiry_continue_shopping': 'Vous pouvez continuer vos achats pendant que nous préparons votre réponse.',
    
    // Checkout messages
    'checkout.delivery_title': '🚚 <b>Informations de Livraison</b>',
    'checkout.order_number_label': '<b>Numéro de Commande :</b> {orderNumber}',
    'checkout.selected_delivery': 'Sélectionné : {name} ({time})',
    'checkout.delivery_cost': 'Coût : {cost}',
    'checkout.delivery_free': 'Gratuit',
    'checkout.address_format_title': 'Veuillez fournir vos informations dans ce format :',
    'checkout.required_format': '📝 Format Requis :',
    'checkout.format_fullname': 'Nom Complet',
    'checkout.format_phone': 'Numéro de Téléphone',
    'checkout.format_street': 'Adresse',
    'checkout.format_city': 'Ville, État Code Postal',
    'checkout.format_country': 'Pays',
    'checkout.example_title': 'Exemple :',
    'checkout.example_name': 'Jean Dupont',
    'checkout.example_phone': '+33 (6) 12 34 56 78',
    'checkout.example_street': '123 Rue Principale',
    'checkout.example_city': 'Paris, ÎDF 75001',
    'checkout.example_country': 'France',
    
    // Order confirmation
    'order.confirmation_title': '✅ <b>Commande Confirmée !</b>',
    'order.thank_you': 'Merci pour votre commande !',
    'order.customer_id': '<b>ID Client :</b> {userId}',
    'order.total_label': '<b>Total :</b> {total}',
    'order.status_label': '<b>Statut :</b> Terminé',
    'order.next_steps': '📋 <b>Prochaines Étapes :</b>',
    'order.step_payment': '1. Vérification du paiement (si applicable)',
    'order.step_processing': '2. Traitement de la commande (1-2 jours ouvrables)',
    'order.step_shipping': '3. Préparation de l\'envoi/retrait',
    'order.step_tracking': '4. Informations de suivi de livraison',
    'order.support_contact_label': '📞 <b>Contact Assistance :</b>',
    'order.include_order_number': '• Incluez votre numéro de commande : {orderNumber}',
    'order.estimated_processing': '<b>Traitement Estimé :</b> 1-2 jours ouvrables',
    'order.thank_you_shopping': 'Merci de faire vos achats chez nous ! 🛍️',
    
    // Cart actions
    'cart.cleared_title': '🗑️ <b>Panier Vidé</b>',
    'cart.cleared_message': 'Tous les articles ont été retirés de votre panier.',
  },
  
  de: {
    // Welcome messages
    'welcome.message': '🛍️ Willkommen bei TeleShop!\n\nWählen Sie eine Option unten:',
    'welcome.returning': '🛍️ Willkommen zurück bei TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Produkte',
    'menu.carts': '🛒 Warenkorb',
    'menu.orders': '📦 Bestellungen',
    'menu.wishlist': '❤️ Wunschliste',
    'menu.rating': '⭐ Bewertungen',
    'menu.operator': '👤 Support',
    'menu.back': '🔙 Zurück zum Menü',
    'menu.settings': '⚙️ Einstellungen',
    'menu.language': '🌐 Sprache',
    'menu.currency': '💱 Währung',
    
    // Listings
    'listings.title': '📋 *Produktkategorie wählen:*',
    'listings.no_products': '📋 Derzeit sind keine Produkte verfügbar.\n\nKommen Sie später für neue Angebote zurück!',
    'listings.category_products': '{name} ({count} Produkte)',
    
    // Cart
    'cart.title': '🛒 *Ihr Warenkorb*',
    'cart.empty': 'Ihr Warenkorb ist leer. Beginnen Sie zu shoppen und fügen Sie Artikel hinzu!',
    'cart.total': '💰 *Gesamt: {total}*',
    'cart.checkout_ready': '🚀 *Bereit zum Bezahlen?*\nVervollständigen Sie Ihre Bestellung mit Liefer-, Zahlungs- und Kontaktoptionen.',
    'cart.proceed_checkout': '🛒 Zur Kasse gehen',
    'cart.clear_cart': '🔄 Warenkorb leeren',
    'cart.quantity': 'Menge: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 In den Warenkorb',
    'product.add_to_wishlist': '❤️ Zur Wunschliste',
    'product.rate_product': '⭐ Produkt bewerten',
    'product.stock': 'Lagerbestand: {stock}',
    'product.price': 'Preis: {price}',
    'product.out_of_stock': '❌ Nicht auf Lager',
    'product.added_to_cart': '✅ Zum Warenkorb hinzugefügt: {product}',
    'product.added_to_wishlist': '✅ Zur Wunschliste hinzugefügt: {product}',
    
    // Orders
    'orders.title': '📦 *Ihre Bestellungen*',
    'orders.no_orders': 'Noch keine Bestellungen. Tätigen Sie Ihren ersten Kauf!',
    'orders.order_number': 'Bestellung {number}',
    'orders.status': 'Status: {status}',
    'orders.total': 'Gesamt: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Bestellvorgang*',
    'checkout.delivery_method': 'Liefermethode wählen:',
    'checkout.payment_method': 'Zahlungsmethode wählen:',
    'checkout.confirm_order': '✅ Bestellung bestätigen',
    'checkout.order_confirmed': '✅ Bestellung bestätigt! Bestellnummer: {orderNumber}',
    
    // Support
    'support.title': '👤 *Kundensupport*',
    'support.options': 'Wie können wir Ihnen helfen?',
    'support.send_message': '💬 Nachricht senden',
    'support.email_support': '📧 E-Mail Support',
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Einstellungen*',
    'settings.language_title': '🌐 *Sprache wählen:*',
    'settings.currency_title': '💱 *Währung wählen:*',
    'settings.language_changed': '✅ Sprache geändert zu {language}',
    'settings.currency_changed': '✅ Währung geändert zu {currency}',
    'settings.language_current': 'Aktuelle Sprache: {language}',
    'settings.currency_current': 'Aktuelle Währung: {currency}',
    
    // Common actions
    'action.back': '🔙 Zurück',
    'action.cancel': '❌ Abbrechen',
    'action.confirm': '✅ Bestätigen',
    'action.continue': '➡️ Weiter',
    'action.save': '💾 Speichern',
    
    // Button labels
    'button.main_menu': '🏠 Hauptmenü',
    'button.back_to_menu': '🔙 Zurück zum Menü',
    'button.view_orders': '📦 Meine Bestellungen Ansehen',
    'button.contact_support': '👤 Support Kontaktieren',
    'button.live_chat': '💬 Live-Chat mit Mitarbeiter',
    'button.submit_inquiry': '📋 Support-Anfrage Senden',
    'button.email_support': '📧 E-Mail Support',
    'button.send_message': '💬 Stattdessen Nachricht Senden',
    'button.back_operator': '🔙 Zurück zum Operator-Menü',
    'button.listings': '📋 Angebote',
    'button.view_cart': '🛒 Warenkorb Ansehen',
    'button.add_to_cart': '🛒 In den Warenkorb',
    'button.add_to_wishlist': '❤️ Zur Wunschliste',
    'button.rate_product': '⭐ Produkt Bewerten',
    'button.view_session': '📋 Sitzung Ansehen',
    'button.end_session': '❌ Sitzung Beenden',
    
    // Error messages
    'error.general': '❌ Ein Fehler ist aufgetreten. Bitte versuchen Sie es erneut.',
    'error.product_not_found': '❌ Produkt nicht gefunden.',
    'error.out_of_stock': '❌ Produkt ist nicht auf Lager.',
    'error.invalid_quantity': '❌ Ungültige Menge.',
    
    // Success messages
    'success.cart_cleared': '✅ Warenkorb erfolgreich geleert.',
    'success.item_removed': '✅ Artikel aus dem Warenkorb entfernt.',
    'success.order_placed': '✅ Bestellung erfolgreich aufgegeben!',
    
    // Welcome and default messages
    'welcome.default': '🎉 Willkommen {username} in unserem Shop!\n\n🛍️ <b>Ihre Anlaufstelle für großartige Produkte</b>\n\nVerwenden Sie die Schaltflächen unten, um unseren Katalog zu durchsuchen, Ihren Warenkorb zu verwalten oder Unterstützung zu erhalten.',
    
    // Operator/Support detailed messages
    'operator.contact_title': '👤 <b>Support Kontaktieren</b>',
    'operator.need_help': 'Brauchen Sie Hilfe? Unser Support-Team ist für Sie da!',
    'operator.support_contact': '📞 <b>Support-Kontakt:</b>',
    'operator.telegram': '• Telegram: {contact}',
    'operator.email': '• E-Mail: {email}',
    'operator.business_hours': '🕒 <b>Geschäftszeiten:</b>\n{hours}',
    'operator.quick_help': '💬 <b>Für Schnelle Hilfe:</b>',
    'operator.order_issues': '• Bestellprobleme: Antworten Sie mit Ihrer Bestellnummer',
    'operator.product_questions': '• Produktfragen: Fragen Sie nach bestimmten Artikeln',
    'operator.technical_support': '• Technischer Support: Beschreiben Sie Ihr Problem',
    'operator.response_time': '⚡ <b>Durchschnittliche Antwortzeit:</b> {time}',
    
    // Live support session
    'support.session_title': '💬 <b>Live-Support-Sitzung Starten</b>',
    'support.session_description': 'Bitte beschreiben Sie Ihr Problem oder Ihre Frage. Ein Support-Mitarbeiter wird Ihnen zugewiesen.',
    'support.categories_title': '<b>Kategorien:</b>',
    'support.category_general': '• Allgemeine Fragen',
    'support.category_order': '• Bestellanfragen',
    'support.category_product': '• Produktsupport',
    'support.category_payment': '• Zahlungsprobleme',
    'support.category_delivery': '• Lieferfragen',
    'support.type_message': 'Geben Sie Ihre Nachricht unten ein:',
    'support.back_to_options': '🔙 Zurück zu Support-Optionen',
    'support.session_created': '✅ <b>Support-Sitzung Erstellt</b>',
    'support.session_id': 'Sitzungs-ID: `{id}`',
    'support.session_status_waiting': 'Status: ⏳ Warten auf Support-Mitarbeiter',
    'support.session_priority': 'Priorität: {priority}',
    'support.your_request': 'Ihre Anfrage: "{message}"',
    'support.notification_pending': 'Sie werden benachrichtigt, wenn ein Support-Mitarbeiter Ihrer Sitzung zugewiesen wurde.',
    'support.session_ended': '✅ <b>Support-Sitzung Beendet</b>',
    'support.session_status_resolved': 'Status: Gelöst',
    'support.thank_you': 'Vielen Dank für die Nutzung unseres Support-Service!',
    
    // FAQ
    'faq.title': '❓ <b>Häufig Gestellte Fragen</b>',
    'faq.ordering_title': '🛒 Bestellungen:',
    'faq.how_to_order_q': '• F: Wie kann ich eine Bestellung aufgeben?',
    'faq.how_to_order_a': '• A: Produkte durchsuchen, in den Warenkorb legen, dann zur Kasse gehen',
    'faq.modify_order_q': '• F: Kann ich meine Bestellung ändern?',
    'faq.modify_order_a': '• A: Kontaktieren Sie den Support innerhalb von 1 Stunde nach der Bestellung',
    'faq.shipping_title': '📦 Versand:',
    'faq.shipping_time_q': '• F: Wie lange dauert der Versand?',
    'faq.shipping_time_a': '• A: 3-7 Werktage für Standardversand',
    'faq.international_q': '• F: Versenden Sie international?',
    'faq.international_a': '• A: Derzeit nur Versand innerhalb der USA',
    'faq.payment_title': '💳 Zahlung:',
    'faq.payment_methods_q': '• F: Welche Zahlungsmethoden akzeptieren Sie?',
    'faq.payment_methods_a': '• A: Kreditkarten, PayPal, Banküberweisung und Krypto',
    'faq.returns_title': '🔄 Rücksendungen:',
    'faq.return_policy_q': '• F: Was ist Ihre Rückgaberichtlinie?',
    'faq.return_policy_a': '• A: 30-Tage-Rückgabe für ungeöffnete Produkte',
    'faq.technical_title': '📱 Technisch:',
    'faq.bot_not_responding_q': '• F: Bot antwortet nicht?',
    'faq.bot_not_responding_a': '• A: Versuchen Sie den Befehl /start oder kontaktieren Sie den Support',
    'faq.need_more_help': 'Benötigen Sie weitere Hilfe? Kontaktieren Sie unser Support-Team!',
    
    // Support inquiry confirmation
    'support.inquiry_received': '✅ <b>Support-Anfrage Erhalten</b>',
    'support.inquiry_response_time': 'Ihre Support-Anfrage wurde erhalten. Unser Team wird innerhalb von {time} antworten.',
    'support.inquiry_your_message': 'Ihre Nachricht: "{message}"',
    'support.inquiry_contact_directly': 'Kontaktieren Sie {contact} direkt: Sie können auch {contact} auf Telegram eine Nachricht senden{usernameInfo}',
    'support.inquiry_with_username': ' unter Angabe Ihres Benutzernamens @{username}',
    'support.inquiry_with_userid': ' mit Ihrer Benutzer-ID: {userId}',
    'support.inquiry_ticket_id': 'Ticket-ID: #{ticketId}',
    'support.inquiry_continue_shopping': 'Sie können weiter einkaufen, während wir Ihre Antwort vorbereiten.',
    
    // Checkout messages
    'checkout.delivery_title': '🚚 <b>Lieferinformationen</b>',
    'checkout.order_number_label': '<b>Bestellnummer:</b> {orderNumber}',
    'checkout.selected_delivery': 'Ausgewählt: {name} ({time})',
    'checkout.delivery_cost': 'Kosten: {cost}',
    'checkout.delivery_free': 'Kostenlos',
    'checkout.address_format_title': 'Bitte geben Sie Ihre Informationen in diesem Format an:',
    'checkout.required_format': '📝 Erforderliches Format:',
    'checkout.format_fullname': 'Vollständiger Name',
    'checkout.format_phone': 'Telefonnummer',
    'checkout.format_street': 'Straßenadresse',
    'checkout.format_city': 'Stadt, Bundesland PLZ',
    'checkout.format_country': 'Land',
    'checkout.example_title': 'Beispiel:',
    'checkout.example_name': 'Max Mustermann',
    'checkout.example_phone': '+49 (171) 123-4567',
    'checkout.example_street': 'Hauptstraße 123',
    'checkout.example_city': 'Berlin, BE 10115',
    'checkout.example_country': 'Deutschland',
    
    // Order confirmation
    'order.confirmation_title': '✅ <b>Bestellung Bestätigt!</b>',
    'order.thank_you': 'Vielen Dank für Ihre Bestellung!',
    'order.customer_id': '<b>Kunden-ID:</b> {userId}',
    'order.total_label': '<b>Gesamt:</b> {total}',
    'order.status_label': '<b>Status:</b> Abgeschlossen',
    'order.next_steps': '📋 <b>Nächste Schritte:</b>',
    'order.step_payment': '1. Zahlungsverifizierung (falls zutreffend)',
    'order.step_processing': '2. Bestellbearbeitung (1-2 Werktage)',
    'order.step_shipping': '3. Versand-/Abholungsvorbereitung',
    'order.step_tracking': '4. Lieferverfolgungsinformationen',
    'order.support_contact_label': '📞 <b>Support-Kontakt:</b>',
    'order.include_order_number': '• Geben Sie Ihre Bestellnummer an: {orderNumber}',
    'order.estimated_processing': '<b>Geschätzte Bearbeitungszeit:</b> 1-2 Werktage',
    'order.thank_you_shopping': 'Vielen Dank für Ihren Einkauf bei uns! 🛍️',
    
    // Cart actions
    'cart.cleared_title': '🗑️ <b>Warenkorb Geleert</b>',
    'cart.cleared_message': 'Alle Artikel wurden aus Ihrem Warenkorb entfernt.',
  },
  
  nl: {
    // Welcome messages
    'welcome.message': '🛍️ Welkom bij TeleShop!\n\nKies een optie hieronder:',
    'welcome.returning': '🛍️ Welkom terug bij TeleShop!',
    
    // Main menu
    'menu.listings': '📋 Producten',
    'menu.carts': '🛒 Winkelwagen',
    'menu.orders': '📦 Bestellingen',
    'menu.wishlist': '❤️ Verlanglijst',
    'menu.rating': '⭐ Beoordelingen',
    'menu.operator': '👤 Ondersteuning',
    'menu.back': '🔙 Terug naar Menu',
    'menu.settings': '⚙️ Instellingen',
    'menu.language': '🌐 Taal',
    'menu.currency': '💱 Valuta',
    
    // Listings
    'listings.title': '📋 *Productcategorie kiezen:*',
    'listings.no_products': '📋 Momenteel zijn er geen producten beschikbaar.\n\nKom later terug voor nieuwe aanbiedingen!',
    'listings.category_products': '{name} ({count} producten)',
    
    // Cart
    'cart.title': '🛒 *Uw Winkelwagen*',
    'cart.empty': 'Uw winkelwagen is leeg. Begin met winkelen om artikelen toe te voegen!',
    'cart.total': '💰 *Totaal: {total}*',
    'cart.checkout_ready': '🚀 *Klaar om af te rekenen?*\nVoltooi uw bestelling met bezorg-, betalings- en contactopties.',
    'cart.proceed_checkout': '🛒 Doorgaan naar Afrekenen',
    'cart.clear_cart': '🔄 Winkelwagen Leegmaken',
    'cart.quantity': 'Aantal: {quantity} × {price} = {total}',
    
    // Products
    'product.add_to_cart': '🛒 Toevoegen aan Winkelwagen',
    'product.add_to_wishlist': '❤️ Toevoegen aan Verlanglijst',
    'product.rate_product': '⭐ Product Beoordelen',
    'product.stock': 'Voorraad: {stock}',
    'product.price': 'Prijs: {price}',
    'product.out_of_stock': '❌ Niet op Voorraad',
    'product.added_to_cart': '✅ Toegevoegd aan winkelwagen: {product}',
    'product.added_to_wishlist': '✅ Toegevoegd aan verlanglijst: {product}',
    
    // Orders
    'orders.title': '📦 *Uw Bestellingen*',
    'orders.no_orders': 'Nog geen bestellingen. Doe uw eerste aankoop!',
    'orders.order_number': 'Bestelling {number}',
    'orders.status': 'Status: {status}',
    'orders.total': 'Totaal: {total}',
    
    // Checkout
    'checkout.title': '🛒 *Afreken Proces*',
    'checkout.delivery_method': 'Bezorgmethode kiezen:',
    'checkout.payment_method': 'Betaalmethode kiezen:',
    'checkout.confirm_order': '✅ Bestelling Bevestigen',
    'checkout.order_confirmed': '✅ Bestelling bevestigd! Bestellingnummer: {orderNumber}',
    
    // Support
    'support.title': '👤 *Klantenservice*',
    'support.options': 'Hoe kunnen we u helpen?',
    'support.send_message': '💬 Bericht Versturen',
    'support.email_support': '📧 E-mail Ondersteuning',
    'support.faq': '❓ FAQ',
    
    // Settings
    'settings.title': '⚙️ *Instellingen*',
    'settings.language_title': '🌐 *Taal kiezen:*',
    'settings.currency_title': '💱 *Valuta kiezen:*',
    'settings.language_changed': '✅ Taal gewijzigd naar {language}',
    'settings.currency_changed': '✅ Valuta gewijzigd naar {currency}',
    'settings.language_current': 'Huidige taal: {language}',
    'settings.currency_current': 'Huidige valuta: {currency}',
    
    // Common actions
    'action.back': '🔙 Terug',
    'action.cancel': '❌ Annuleren',
    'action.confirm': '✅ Bevestigen',
    'action.continue': '➡️ Doorgaan',
    'action.save': '💾 Opslaan',
    
    // Button labels
    'button.main_menu': '🏠 Hoofdmenu',
    'button.back_to_menu': '🔙 Terug naar Menu',
    'button.view_orders': '📦 Mijn Bestellingen Bekijken',
    'button.contact_support': '👤 Contact Opnemen met Support',
    'button.live_chat': '💬 Live Chat met Medewerker',
    'button.submit_inquiry': '📋 Support-verzoek Indienen',
    'button.email_support': '📧 E-mail Support',
    'button.send_message': '💬 In Plaats Daarvan Bericht Sturen',
    'button.back_operator': '🔙 Terug naar Operator Menu',
    'button.listings': '📋 Aanbiedingen',
    'button.view_cart': '🛒 Winkelwagen Bekijken',
    'button.add_to_cart': '🛒 Toevoegen aan Winkelwagen',
    'button.add_to_wishlist': '❤️ Toevoegen aan Verlanglijst',
    'button.rate_product': '⭐ Product Beoordelen',
    'button.view_session': '📋 Sessie Bekijken',
    'button.end_session': '❌ Sessie Beëindigen',
    
    // Error messages
    'error.general': '❌ Er is een fout opgetreden. Probeer het opnieuw.',
    'error.product_not_found': '❌ Product niet gevonden.',
    'error.out_of_stock': '❌ Product is niet op voorraad.',
    'error.invalid_quantity': '❌ Ongeldige hoeveelheid.',
    
    // Success messages
    'success.cart_cleared': '✅ Winkelwagen succesvol leeggemaakt.',
    'success.item_removed': '✅ Artikel verwijderd uit winkelwagen.',
    'success.order_placed': '✅ Bestelling succesvol geplaatst!',
    
    // Welcome and default messages
    'welcome.default': '🎉 Welkom {username} in onze Winkel!\n\n🛍️ <b>Uw one-stop bestemming voor geweldige producten</b>\n\nGebruik de knoppen hieronder om onze catalogus te verkennen, uw winkelwagen te beheren of ondersteuning te krijgen.',
    
    // Operator/Support detailed messages
    'operator.contact_title': '👤 <b>Contacteer Ondersteuning</b>',
    'operator.need_help': 'Hulp nodig? Ons ondersteuningsteam staat voor u klaar!',
    'operator.support_contact': '📞 <b>Ondersteuningscontact:</b>',
    'operator.telegram': '• Telegram: {contact}',
    'operator.email': '• E-mail: {email}',
    'operator.business_hours': '🕒 <b>Openingstijden:</b>\n{hours}',
    'operator.quick_help': '💬 <b>Voor Snelle Hulp:</b>',
    'operator.order_issues': '• Bestelproblemen: Antwoord met uw bestellingnummer',
    'operator.product_questions': '• Productvragen: Vraag naar specifieke artikelen',
    'operator.technical_support': '• Technische ondersteuning: Beschrijf uw probleem',
    'operator.response_time': '⚡ <b>Gemiddelde Reactietijd:</b> {time}',
    
    // Live support session
    'support.session_title': '💬 <b>Start Live Ondersteuningssessie</b>',
    'support.session_description': 'Beschrijf uw probleem of vraag. Een medewerker wordt aan u toegewezen.',
    'support.categories_title': '<b>Categorieën:</b>',
    'support.category_general': '• Algemene vragen',
    'support.category_order': '• Bestelverzoeken',
    'support.category_product': '• Productondersteuning',
    'support.category_payment': '• Betalingsproblemen',
    'support.category_delivery': '• Leveringsvragen',
    'support.type_message': 'Typ uw bericht hieronder:',
    'support.back_to_options': '🔙 Terug naar Ondersteuningsopties',
    'support.session_created': '✅ <b>Ondersteuningssessie Aangemaakt</b>',
    'support.session_id': 'Sessie-ID: `{id}`',
    'support.session_status_waiting': 'Status: ⏳ Wachten op medewerker',
    'support.session_priority': 'Prioriteit: {priority}',
    'support.your_request': 'Uw verzoek: "{message}"',
    'support.notification_pending': 'U wordt op de hoogte gesteld wanneer een medewerker aan uw sessie is toegewezen.',
    'support.session_ended': '✅ <b>Ondersteuningssessie Beëindigd</b>',
    'support.session_status_resolved': 'Status: Opgelost',
    'support.thank_you': 'Bedankt voor het gebruiken van onze ondersteuningsservice!',
    
    // FAQ
    'faq.title': '❓ <b>Veelgestelde Vragen</b>',
    'faq.ordering_title': '🛒 Bestellen:',
    'faq.how_to_order_q': '• V: Hoe plaats ik een bestelling?',
    'faq.how_to_order_a': '• A: Blader door producten, voeg toe aan winkelwagen, ga dan naar afrekenen',
    'faq.modify_order_q': '• V: Kan ik mijn bestelling wijzigen?',
    'faq.modify_order_a': '• A: Neem binnen 1 uur na bestelling contact op met ondersteuning',
    'faq.shipping_title': '📦 Verzending:',
    'faq.shipping_time_q': '• V: Hoe lang duurt verzending?',
    'faq.shipping_time_a': '• A: 3-7 werkdagen voor standaard verzending',
    'faq.international_q': '• V: Verzenden jullie internationaal?',
    'faq.international_a': '• A: Momenteel alleen verzending binnen de VS',
    'faq.payment_title': '💳 Betaling:',
    'faq.payment_methods_q': '• V: Welke betaalmethoden accepteren jullie?',
    'faq.payment_methods_a': '• A: Creditcards, PayPal, bankoverschrijving en crypto',
    'faq.returns_title': '🔄 Retouren:',
    'faq.return_policy_q': '• V: Wat is uw retourbeleid?',
    'faq.return_policy_a': '• A: 30-dagen retour voor ongeopende producten',
    'faq.technical_title': '📱 Technisch:',
    'faq.bot_not_responding_q': '• V: Bot reageert niet?',
    'faq.bot_not_responding_a': '• A: Probeer het commando /start of neem contact op met ondersteuning',
    'faq.need_more_help': 'Meer hulp nodig? Neem contact op met ons ondersteuningsteam!',
    
    // Support inquiry confirmation
    'support.inquiry_received': '✅ <b>Ondersteuningsverzoek Ontvangen</b>',
    'support.inquiry_response_time': 'Uw ondersteuningsverzoek is ontvangen. Ons team zal binnen {time} reageren.',
    'support.inquiry_your_message': 'Uw bericht: "{message}"',
    'support.inquiry_contact_directly': 'Neem direct contact op met {contact}: U kunt ook een bericht sturen naar {contact} op Telegram{usernameInfo}',
    'support.inquiry_with_username': ' onder vermelding van uw gebruikersnaam @{username}',
    'support.inquiry_with_userid': ' met uw Gebruikers-ID: {userId}',
    'support.inquiry_ticket_id': 'Ticket-ID: #{ticketId}',
    'support.inquiry_continue_shopping': 'U kunt blijven winkelen terwijl we uw antwoord voorbereiden.',
    
    // Checkout messages
    'checkout.delivery_title': '🚚 <b>Leveringsinformatie</b>',
    'checkout.order_number_label': '<b>Bestellingnummer:</b> {orderNumber}',
    'checkout.selected_delivery': 'Geselecteerd: {name} ({time})',
    'checkout.delivery_cost': 'Kosten: {cost}',
    'checkout.delivery_free': 'Gratis',
    'checkout.address_format_title': 'Geef uw informatie in dit formaat:',
    'checkout.required_format': '📝 Vereist Formaat:',
    'checkout.format_fullname': 'Volledige Naam',
    'checkout.format_phone': 'Telefoonnummer',
    'checkout.format_street': 'Straatnaam en huisnummer',
    'checkout.format_city': 'Stad, Provincie Postcode',
    'checkout.format_country': 'Land',
    'checkout.example_title': 'Voorbeeld:',
    'checkout.example_name': 'Jan de Vries',
    'checkout.example_phone': '+31 (6) 1234-5678',
    'checkout.example_street': 'Hoofdstraat 123',
    'checkout.example_city': 'Amsterdam, NH 1012',
    'checkout.example_country': 'Nederland',
    
    // Order confirmation
    'order.confirmation_title': '✅ <b>Bestelling Bevestigd!</b>',
    'order.thank_you': 'Bedankt voor uw bestelling!',
    'order.customer_id': '<b>Klant-ID:</b> {userId}',
    'order.total_label': '<b>Totaal:</b> {total}',
    'order.status_label': '<b>Status:</b> Voltooid',
    'order.next_steps': '📋 <b>Volgende Stappen:</b>',
    'order.step_payment': '1. Betalingsverificatie (indien van toepassing)',
    'order.step_processing': '2. Bestelverwerking (1-2 werkdagen)',
    'order.step_shipping': '3. Verzending/Ophaalvoorbereiding',
    'order.step_tracking': '4. Leveringsvolginformatie',
    'order.support_contact_label': '📞 <b>Ondersteuningscontact:</b>',
    'order.include_order_number': '• Vermeld uw bestellingnummer: {orderNumber}',
    'order.estimated_processing': '<b>Geschatte Verwerkingstijd:</b> 1-2 werkdagen',
    'order.thank_you_shopping': 'Bedankt voor uw aankoop bij ons! 🛍️',
    
    // Cart actions
    'cart.cleared_title': '🗑️ <b>Winkelwagen Leeggemaakt</b>',
    'cart.cleared_message': 'Alle artikelen zijn verwijderd uit uw winkelwagen.',
  }
};

export class I18nService {
  private static instance: I18nService;
  private defaultLanguage = 'en';
  
  static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  /**
   * Get user's preferred language from storage
   */
  async getUserLanguage(telegramUserId: string): Promise<string> {
    try {
      const preferences = await storage.getUserPreferences(telegramUserId);
      return preferences?.languageCode || this.defaultLanguage;
    } catch (error) {
      console.error('Error getting user language:', error);
      return this.defaultLanguage;
    }
  }

  /**
   * Get localized message by key
   */
  async t(telegramUserId: string, key: string, params?: Record<string, string | number>): Promise<string> {
    const language = await this.getUserLanguage(telegramUserId);
    
    // If it's a welcome message, use configurable bot settings
    if (key === 'welcome.message' || key === 'welcome.returning') {
      return this.getConfigurableWelcomeMessage(language, key, params);
    }
    
    return this.translate(key, language, params);
  }

  /**
   * Get localized message by key and language (without user lookup)
   */
  translate(key: string, language: string = this.defaultLanguage, params?: Record<string, string | number>): string {
    const catalog = messageCatalogs[language] || messageCatalogs[this.defaultLanguage];
    let message = catalog[key] || messageCatalogs[this.defaultLanguage][key] || key;

    // Replace parameters in the message
    if (params) {
      for (const [param, value] of Object.entries(params)) {
        message = message.replace(`{${param}}`, String(value));
      }
    }

    return message;
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): Array<{code: string, name: string}> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Español' },
      { code: 'fr', name: 'Français' },
      { code: 'de', name: 'Deutsch' },
      { code: 'nl', name: 'Nederlands' }
    ];
  }

  /**
   * Check if language is supported
   */
  isLanguageSupported(languageCode: string): boolean {
    return !!messageCatalogs[languageCode];
  }

  /**
   * Get configurable welcome message from bot settings
   */
  private async getConfigurableWelcomeMessage(language: string, key: string, params?: Record<string, string | number>): Promise<string> {
    try {
      // Get bot settings for store name and welcome message
      const storeNameSetting = await storage.getBotSetting('store_name');
      const welcomeMessageSetting = await storage.getBotSetting('welcome_message');
      
      const storeName = storeNameSetting?.value || 'TeleShop';
      const customWelcomeMessage = welcomeMessageSetting?.value;
      
      // If there's a custom welcome message, use it (it should already be in the user's preferred language)
      if (customWelcomeMessage && key === 'welcome.message') {
        let message = customWelcomeMessage;
        
        // Replace parameters in the custom message
        if (params) {
          for (const [param, value] of Object.entries(params)) {
            message = message.replace(`{${param}}`, String(value));
          }
        }
        
        return message;
      }
      
      // Otherwise use the template from messageCatalogs with dynamic store name
      const catalog = messageCatalogs[language] || messageCatalogs[this.defaultLanguage];
      let message = catalog[key] || messageCatalogs[this.defaultLanguage][key] || key;
      
      // Replace TeleShop with the configured store name
      message = message.replace(/TeleShop/g, storeName);
      
      // Replace other parameters
      if (params) {
        for (const [param, value] of Object.entries(params)) {
          message = message.replace(`{${param}}`, String(value));
        }
      }
      
      return message;
    } catch (error) {
      console.error('Error getting configurable welcome message:', error);
      // Fallback to default template
      return this.translate(key, language, params);
    }
  }

  /**
   * Get currency-aware price formatting with optional source currency
   */
  async formatPrice(telegramUserId: string, price: string | number, sourceCurrency?: string): Promise<string> {
    try {
      // If source currency is provided, use it directly (for showing product in its actual currency)
      // Otherwise, use user's preferred currency (for conversions)
      let currencyCode: string;
      
      if (sourceCurrency) {
        currencyCode = sourceCurrency;
      } else {
        const preferences = await storage.getUserPreferences(telegramUserId);
        currencyCode = preferences?.currencyCode || 'USD';
      }

      // Get currency info from database
      const currencies = await storage.getCurrencies();
      const currency = currencies.find(c => c.code === currencyCode);
      
      if (!currency) {
        // Fallback to USD if currency not found
        return `$${Number(price).toFixed(2)}`;
      }

      const numPrice = Number(price);
      const formattedAmount = numPrice.toFixed(currency.decimalPlaces);
      
      return `${currency.symbol}${formattedAmount}`;
    } catch (error) {
      console.error('Error formatting price:', error);
      // Try to get USD currency info for fallback
      try {
        const currencies = await storage.getCurrencies();
        const usdCurrency = currencies.find(c => c.code === 'USD');
        if (usdCurrency) {
          return `${usdCurrency.symbol}${Number(price).toFixed(usdCurrency.decimalPlaces)}`;
        }
      } catch {}
      return `$${Number(price).toFixed(2)}`;
    }
  }

  /**
   * Get formatted product price with currency conversion
   */
  async getProductPrice(telegramUserId: string, product: any): Promise<{
    formattedPrice: string;
    originalPrice: string;
    currencyCode: string;
  }> {
    try {
      // Validate product has a price
      if (!product || typeof product.price === 'undefined' || product.price === null) {
        console.error('Invalid price format:', product?.price);
        // Use user's preferred currency even for zero price
        const preferences = await storage.getUserPreferences(telegramUserId);
        const userCurrency = preferences?.currencyCode || 'USD';
        const currencies = await storage.getCurrencies();
        const currency = currencies.find(c => c.code === userCurrency);
        const symbol = currency?.symbol || '$';
        const decimals = currency?.decimalPlaces || 2;
        return {
          formattedPrice: `${symbol}${(0).toFixed(decimals)}`,
          originalPrice: '0.00',
          currencyCode: userCurrency
        };
      }

      // Import currency service dynamically to avoid circular dependency
      const { currencyService } = await import('./currency-service.js');
      
      // Get product's actual currency or fallback to USD
      const productCurrency = product.currencyCode || 'USD';
      
      // Always use the product's actual currency for display
      const formattedPrice = await this.formatPrice(telegramUserId, product.price, productCurrency);
      return {
        formattedPrice,
        originalPrice: product.price.toString(),
        currencyCode: productCurrency
      };
    } catch (error) {
      console.error('Error getting product price:', error);
      // Use user's preferred currency even in error cases
      try {
        const preferences = await storage.getUserPreferences(telegramUserId);
        const userCurrency = preferences?.currencyCode || 'USD';
        const currencies = await storage.getCurrencies();
        const currency = currencies.find(c => c.code === userCurrency);
        const symbol = currency?.symbol || '$';
        const decimals = currency?.decimalPlaces || 2;
        return {
          formattedPrice: `${symbol}${(0).toFixed(decimals)}`,
          originalPrice: '0.00',
          currencyCode: userCurrency
        };
      } catch {
        return {
          formattedPrice: '$0.00',
          originalPrice: '0.00',
          currencyCode: 'USD'
        };
      }
    }
  }
}

export const i18n = I18nService.getInstance();