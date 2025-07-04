//localhost:3000 - should be changed

export const callBackendPrediction = async (message, sessionId, userId, chatHistory = [], files = []) => {
  try {
    console.log(userId)
    const response = await fetch("http://localhost:3000/textGeneration", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message,
        sessionId,
        userId,
        chatHistory,
        files: files.length > 0 ? files : undefined // Only include files if there are any
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`API Error ${response.status}: ${errText}`);
    }

    const result = await response.json();
    return result.response;
    
  } catch (err) {
    console.error("Backend call failed:", err);
    throw err;
  }
};