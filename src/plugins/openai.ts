import OpenAI from 'openai';

export const createOpenAIPlugin = () => {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API Key is missing. Please check your .env file.');
  }

  const openai = new OpenAI({
    apiKey: apiKey || '',  // Explicit string type
    dangerouslyAllowBrowser: true
  });

  return {
    install(Vue: any) {
      Vue.prototype.$openai = openai;
    }
  };
}; 