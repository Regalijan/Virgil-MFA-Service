export async function onRequestGet(context) {
  // Set the CLIENT_ID, CLIENT_SECRET, and DATA environment variables in the Cloudflare dashboard
  // Set API_URL as well for self-hosting
  const code = new URL(context.request.url).searchParams.get("code");
  const { hostname, protocol } = new URL(context.request.url);
  if (!code)
    return Response.redirect(
      `https://discord.com/api/oauth2/authorize?client_id=${context.env.CLIENT_ID}&redirect_uri=${
        context.env.API_URL
          ? encodeURIComponent(context.env.API_URL)
          : "https%3A%2F%2Fmfa.virgil.gg%2Fv"
      }&response_type=code&scope=identify`,
      307
    );
  const basic_token = `Basic ${btoa(`${context.env.CLIENT_ID}:${context.env.CLIENT_SECRET}`)}`;
  const oauthDataReq = await fetch("https://discord.com/api/oauth2/token", {
    headers: {
      authorization: basic_token,
      "content-type": "application/x-www-form-urlencoded",
    },
    method: "POST",
    body: `grant_type=authorization_code&code=${code}&redirect_url=https%3A%2F%2Fmfa.virgil.gg%2Fv`,
  });
  if (!oauthDataReq.ok)
    return Response.redirect(`${protocol}//${hostname}/fail`, 307);
  const oauthData = await oauthDataReq.json();
  oauthDataReq.expires_at = oauthData.expires_in * 1000 + Date.now();
  delete oauthData.expires_in;
  const userInfoReq = await fetch("https://discord.com/api/users/@me", {
    headers: {
      authorization: `${oauthData.token_type} ${oauthData.access_token}`,
    },
  });
  if (!userInfoReq.ok) {
    await fetch("https://discord.com/api/oauth2/token/revoke", {
      // See https://datatracker.ietf.org/doc/html/rfc7009#section-2.1
      headers: {
        authorization: basic_token,
        "content-type": "application/x-www-form-urlencoded",
      },
      method: "POST",
      body: `token=${oauthData.access_token}&token_type_hint=access_token`,
    });
    return Response.redirect(`${protocol}//${hostname}/fail`, 307);
  }
  const userInfo = await userInfoReq.json();
  await DATA.put(userInfo.id, JSON.stringify(oauthData));
  return Response.redirect(`${protocol}//${hostname}/done`, 307);
}
