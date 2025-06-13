export const createPrediction = async (message, sessionId, userId) => {
  console.log('Sending message:', message);

  try {
    const flowiseData = {
      question: message,
      overrideConfig: {
        sessionId: sessionId,
        user_id: userId,
        chatId: sessionId,
        chatMessageId: sessionId
      }
    };
    
    const response = await fetch(
      `https://cloud.flowiseai.com/api/v1/prediction/1aedc063-d050-4e6a-8a56-fb0aeb31e35b`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.REACT_APP_FLOWISE_API_KEY}`
        },
        body: JSON.stringify(flowiseData)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
    }

    const data = await response.json();
    console.log('Raw API response:', data);
    
    // Handle different response formats from Flowise
    if (typeof data === 'string') {
      return data;
    } else if (data.output) {
      return data.output;
    } else if (data.text) {
      return data.text;
    } else if (data.answer) {
      return data.answer;
    } else if (data.result) {
      return data.result;
    } else {
      // Return the whole response if we can't identify the content
      return JSON.stringify(data);
    }
    
  } catch (error) {
    console.error('Error in createPrediction:', error);
    throw error; // Re-throw so the calling function can handle it
  }
};