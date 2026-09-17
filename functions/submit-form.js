export async function onRequestPost(context) {
  try {
    const data = await context.request.json();
    const { name, email, phone, fulfillment, eventDate, message, company } = data;

    // 1. Honeypot check: if the hidden company field is filled, it's a bot.
    // Silently return success so bots think it worked.
    if (company && company.trim() !== "") {
      return new Response(JSON.stringify({ ok: true }), { 
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 2. Validate required fields (NOTICE: 'company' is excluded here!)
    if (!name || !email || !phone || !fulfillment || !eventDate) {
      return new Response(JSON.stringify({ ok: false, error: "Missing required fields." }), { 
        status: 400,
        headers: { "Content-Type": "application/json" } 
      });
    }

    // 3. Forward the data to your email worker via Service Binding
    const workerResponse = await context.env.EMAIL_WORKER.fetch("https://internal/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, phone, fulfillment, eventDate, message, company: company || '' })
    });

    if (!workerResponse.ok) {
      const errText = await workerResponse.text();
      throw new Error(errText || "Failed to dispatch email worker.");
    }

    // 4. Return success response to index.html
    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    return new Response(JSON.stringify({ ok: false, error: error.message }), { 
      status: 500,
      headers: { "Content-Type": "application/json" } 
    });
  }
}