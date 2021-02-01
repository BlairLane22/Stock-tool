import axios from 'axios';

export async function postData<INPUT, RESULT>(
  { url, jwt }: { url: string; jwt?: string },
  data: INPUT,
): Promise<RESULT> {
  const headers = { Authorization: '' };

  if (jwt) {
    headers.Authorization = `Bearer ${jwt}`;
  }

  try {
    const reply = await axios.post(`${process.env.REST_API_URL}${url}`, data, { headers });
    return reply.data;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

export async function getData<RESULT>(url: string): Promise<RESULT> {
  try {
    const reply = await axios.get(url);
    return reply.data;
  } catch (e) {
    console.log(e.message);
    throw e;
  }
}

export async function getQuote<RESULT>(symbol: string): Promise<RESULT> {
  return getData(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${process.env.FINNHUB_API_TOKEN}`);
}
