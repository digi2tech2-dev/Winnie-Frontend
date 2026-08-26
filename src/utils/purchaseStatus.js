export function isCompletedOrderStatus(status) {
  return String(status || "").trim().toUpperCase() === "COMPLETED";
}

export function getPurchaseStatusCopy(status, isArabic) {
  const isCompleted = isCompletedOrderStatus(status);

  if (isCompleted) {
    return {
      isCompleted,
      fallbackStatus: isArabic ? "تم الشحن بنجاح" : "Top-up successful",
      title: isArabic ? "تم الشحن" : "Top-up complete",
      heading: isArabic ? "تم الشحن بنجاح!" : "Top-up successful!",
      message: isArabic ? "تم إضافة الطلب بنجاح" : "Your order was added successfully",
    };
  }

  return {
    isCompleted,
    fallbackStatus: isArabic ? "قيد التنفيذ" : "Processing",
    title: isArabic ? "طلبك قيد التنفيذ" : "Order is processing",
    heading: isArabic ? "طلبك قيد التنفيذ" : "Your order is processing",
    message: isArabic
      ? "تم استلام طلبك وسيتم تأكيد الشحن بعد إتمامه."
      : "Your order was received and will be confirmed after fulfillment.",
  };
}
