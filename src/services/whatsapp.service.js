const config = require("../config/config");
const axios = require("axios");
const logService = require("./log.service.js");
const userService = require("../modules/users/user.service.js");

async function sendTemplateMessage(
  to,
  templateName,
  bodyParams = [],
  buttonParams = [],
  userDetails = null,
  templateLanguage = "en_US"
) {
  console.log("sendTemplateMessage:", {
    to,
    templateName,
    bodyParams,
    buttonParams,
  });
  const token = config.whatsapp.token;
  const phoneNumberId = config.whatsapp.from;

  const result = {
    status: null,
    message: "",
    data: null,
  };

  try {
    const components = [];

    // Body parameters
    if (bodyParams && bodyParams.length) {
      components.push({
        type: "body",
        parameters: bodyParams.map((p) => ({ type: "text", text: String(p) })), // ensure numbers are strings
      });
    }

    // Button parameters
    if (buttonParams && buttonParams.length) {
      components.push({
        type: "button",
        sub_type: "url", // can be "quick_reply" if your template uses that
        index: "0", // button index
        parameters: buttonParams.map((p) => ({
          type: "text",
          text: String(p),
        })),
      });
    }

    console.log("components:", JSON.stringify(components));

    const response = await axios.post(
      `https://graph.facebook.com/v22.0/${phoneNumberId}/messages`,
      {
        messaging_product: "whatsapp",
        to,
        type: "template",
        template: {
          name: templateName,
          language: { code: templateLanguage },
          components,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    // Success
    result.status = response.status || 200;
    result.message = "Template message sent successfully";
    result.data = response.data;
    console.log("✅ WhatsApp API response:", result);
    // add track log

    try {
      // get userdetails if userDetails is null
      if (!userDetails) {
        userDetails = await userService.getUserDetails(to);
        userDetails = {
          userId: userDetails?.id || null,
        };
        console.log("userDetails:", userDetails);
      }
    } catch (err) {
      console.log("❌ WhatsApp API error getting user:", err);
    }
    
    if (result.status != 200) {
      try {
        logService.addTrackLog([
          "1",
          templateName,
          templateName,
          to.toString(),
          JSON.stringify(result),
          result.status,
          userDetails?.userId || 0,
          "1",
        ]);
      } catch (err) {
        console.log("❌ WhatsApp API log error:", err);
      }
    } else {
      try {
        logService.addTrackLog([
          "1",
          templateName,
          templateName,
          to.toString(),
          JSON.stringify(result),
          result.status,
          userDetails?.userId || 0,
          "1",
        ]);
      } catch (err) {
        console.log("❌ WhatsApp API log error:", err);
      }
    }
    return result;
  } catch (error) {
    // Axios error with response from API
    if (error.response) {
      result.status = error.response.status || 500;
      result.message =
        error.response.data?.error?.message || "WhatsApp API Error";
      result.data = error.response.data || null;
    } else {
      // Network or other error
      result.status = 500;
      result.message = error.message || "Unknown error";
      result.data = null;
    }

    console.error("❌ WhatsApp API error:", result);
    return result;
  }
}

module.exports = {
  sendTemplateMessage,
};
