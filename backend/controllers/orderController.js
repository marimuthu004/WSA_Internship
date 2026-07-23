const Order = require("../models/order");
const FoodItem = require("../models/foodItem");
const Cart = require("../models/cartModel");
const { ObjectId } = require("mongodb");
const ErrorHandler = require("../utils/errorHandler");
const catchAsyncErrors = require("../middlewares/catchAsyncErrors");
const dotenv = require("dotenv");

//setting up config file
dotenv.config({ path: "./config/config.env" });
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Create a new order   =>  /api/v1/order/new
exports.newOrder = catchAsyncErrors(async (req, res, next) => {
  const { session_id } = req.body;

  if (!session_id) {
    return next(new ErrorHandler("Payment session is required", 400));
  }

  const session = await stripe.checkout.sessions.retrieve(session_id, {
    expand: ["customer"],
  });

  const cart = await Cart.findOne({ user: req.user._id })
    .populate({
      path: "items.foodItem",
      select: "name price images",
    })
    .populate({
      path: "restaurant",
      select: "name",
    });

  if (!cart || !cart.items || cart.items.length === 0) {
    return next(new ErrorHandler("Your cart is empty", 400));
  }

  const shippingAddress =
    session.shipping_details?.address || session.customer_details?.address || {};
  const phoneNo = session.customer_details?.phone || "";

  const deliveryInfo = {
    address: [shippingAddress.line1, shippingAddress.line2]
      .filter(Boolean)
      .join(" ") || "Not provided",
    city: shippingAddress.city || "N/A",
    phoneNo,
    postalCode: shippingAddress.postal_code || "",
    country: shippingAddress.country || "",
  };

  const orderItems = cart.items.map((item) => ({
    name: item.foodItem.name,
    quantity: item.quantity,
    image: item.foodItem.images?.[0]?.url || "",
    price: item.foodItem.price,
    fooditem: item.foodItem._id,
  }));

  const paymentInfo = {
    id: session.payment_intent || session.id,
    status: session.payment_status || "paid",
  };

  const deliveryCharge = Number(session.shipping_cost?.amount_subtotal || 0) / 100;
  const itemsPrice = Number(session.amount_subtotal || 0) / 100;
  const finalTotal = Number(session.amount_total || itemsPrice + deliveryCharge) / 100;

  const order = await Order.create({
    orderItems,
    deliveryInfo,
    paymentInfo,
    deliveryCharge,
    itemsPrice,
    finalTotal,
    user: req.user.id,
    restaurant: cart.restaurant?._id,
    paidAt: Date.now(),
  });

  await Cart.findOneAndDelete({ user: req.user._id });

  res.status(200).json({
    success: true,
    order,
  });
});

// Get single order   =>   /api/v1/orders/:id
exports.getSingleOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("restaurant")
    .exec();

  if (!order) {
    return next(new ErrorHandler("No Order found with this ID", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// Get logged in user orders   =>   /api/v1/orders/me
exports.myOrders = catchAsyncErrors(async (req, res, next) => {
  // Get the user ID from req.user
  const userId = new ObjectId(req.user.id);
  // Find orders for the specific user using the retrieved user ID
  const orders = await Order.find({ user: userId })
    .populate("user", "name email")
    .populate("restaurant")
    .exec();

  res.status(200).json({
    success: true,
    orders,
  });
});

// Get all orders - ADMIN  =>   /api/v1/admin/orders/
exports.allOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find();

  let totalAmount = 0;

  orders.forEach((order) => {
    totalAmount += order.finalTotal;
  });

  res.status(200).json({
    success: true,
    totalAmount,
    orders,
  });
});
