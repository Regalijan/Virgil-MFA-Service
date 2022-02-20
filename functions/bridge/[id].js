export async function onRequestGet(context) {
  const { API_TOKEN, DATA } = context.env;
  if (context.request.headers.get("authorization") !== API_TOKEN)
    return new Response('{"error":"Missing or invalid token"}', {
      headers: {
        "content-type": "application/json",
      },
      status: 401,
    });
  const oauthData = await DATA.get(context.params.id);
  if (!oauthData)
    return new Response('{"error":"No data for user"}', {
      headers: {
        "content-type": "application/json",
      },
      status: 404,
    });
  await DATA.delete(context.params.id);
  return new Response(oauthData, {
    headers: {
      "content-type": "application/json",
    },
  });
}
