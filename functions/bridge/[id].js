export async function onRequestGet(context) {
  const { API_TOKEN, DATA } = context.env;
  if (context.request.headers.get("authorization") !== API_TOKEN)
    return new Response('{"error":"Missing or invalid token"}', {
      headers: {
        "content-type": "application/json",
      },
      status: 401,
    });
  const oauthData = await DATA.get(context.env.id);
  if (!oauthData)
    return new Response('{"error":"No data for user"}', {
      headers: {
        "content-type": "application/json",
      },
      status: 404,
    });
  return new Response(oauthData, {
    headers: {
      "content-type": "application/json",
    },
  });
}
