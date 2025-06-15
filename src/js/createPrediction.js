const createPrediction = async (message, sessionId, userId, apiKey, history = [], files = []) => {
  console.log('Sending message:', message);
  console.log('Receiving apiKey:', apiKey);
  console.log('Files to process:', files.length);
  
  try {
    // Process files for Flowise format
    const processedUploads = [];
    
    if (files && files.length > 0) {
      for (const file of files) {
        try {
          // Handle different content types
          let processedFile;
          
          if (file.contentType === 'text') {
            // For text files, send the content directly
            processedFile = {
              data: file.content,
              type: 'text',
              name: file.name,
              mime: file.type
            };
          } else if (file.contentType === 'base64') {
            // For base64 files (images, PDFs, etc.)
            processedFile = {
              data: file.content,
              type: 'file',
              name: file.name,
              mime: file.type
            };
          } else if (file.contentType === 'error') {
            console.warn(`Skipping file ${file.name} due to processing error:`, file.error);
            continue; // Skip files that had processing errors
          }
          
          if (processedFile) {
            processedUploads.push(processedFile);
            console.log(`Processed file: ${file.name} (${file.type})`);
          }
        } catch (fileError) {
          console.error(`Error processing file ${file.name}:`, fileError);
          // Continue with other files even if one fails
        }
      }
    }

    // Prepare the Flowise request payload
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

    // Add uploads to the request if we have processed files
    if (processedUploads.length > 0) {
      flowiseData.uploads = processedUploads;
      console.log(`Sending ${processedUploads.length} files to Flowise`);
    }

    console.log('Flowise request payload:', JSON.stringify({
      ...flowiseData,
      uploads: flowiseData.uploads ? `[${flowiseData.uploads.length} files]` : undefined
    }, null, 2));
    
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
      console.error('Flowise API Error:', errorText);
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
    } else if (data.response) {
      return data.response;
    } else {
      // Return the whole response if we can't identify the content
      console.warn('Unknown response format from Flowise:', data);
      return JSON.stringify(data);
    }
    
  } catch (error) {
    console.error('Error in createPrediction:', error);
    
    // Provide more specific error messages
    if (error.message.includes('413') || error.message.includes('payload too large')) {
      throw new Error('File too large. Please try with smaller files (max 25MB each).');
    } else if (error.message.includes('400')) {
      throw new Error('Invalid file format or request. Please check your files and try again.');
    } else if (error.message.includes('401')) {
      throw new Error('Authentication failed. Please check your API key.');
    } else if (error.message.includes('unsupported media type')) {
      throw new Error('Unsupported file type. Please try with a different file format.');
    } else {
      throw error; // Re-throw original error
    }
  }
};

module.exports = {
  createPrediction,
};