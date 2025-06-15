const createPrediction = async (message, sessionId, userId, apiKey, history = []) => {
  console.log('Sending message:', message);
  console.log('receiving apiKey', apiKey)
  try {
    const flowiseData = {
      question: message,
      overrideConfig: {
        sessionId: sessionId,
        user_id: userId,
        chatId: sessionId,
        chatMessageId: sessionId
      },
      history: history,
    };
    
    const response = await fetch(
      `https://cloud.flowiseai.com/api/v1/prediction/359181df-9f5f-4379-99ad-619e48a567b9`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${apiKey}`
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

module.exports = {
  createPrediction,
};