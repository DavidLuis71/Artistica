export const buildEmailTemplate = (
  title: string,
  content: string,
  nombre: string,
) => {
  const saludo = nombre ? `Hola ${nombre},` : `Hola,`;
  return `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>${title}</title>
  </head>
  <body style="margin:0;padding:0;background-color:#f2f5f9;font-family:Arial,Helvetica,sans-serif;">

    <table width="100%" cellpadding="0" cellspacing="0" style="padding:20px 10px;">
      <tr>
        <td align="center">

          <table width="100%" max-width="600" cellpadding="0" cellspacing="0" 
            style="background:#ffffff;border-radius:14px;overflow:hidden;
            box-shadow:0 4px 20px rgba(0,0,0,0.08);">

            <!-- HEADER -->
            <tr>
              <td style="padding:30px 20px 20px 20px;text-align:center;">
                <img src="https://TU_DOMINIO/logo.png" 
                     alt="NatArt" 
                     width="90" 
                     style="margin-bottom:10px;" />
                <h1 style="margin:0;font-size:22px;color:#1e88e5;">
                  NatArt
                </h1>
                <p style="margin:5px 0 0 0;font-size:14px;color:#666;">
                  Centro de Tecnificación
                </p>
              </td>
            </tr>

            <!-- DIVIDER -->
            <tr>
              <td>
                <hr style="border:none;border-top:1px solid #eee;margin:0 30px;">
              </td>
            </tr>

            <!-- BODY -->
            <tr>
              <td style="padding:30px 30px 20px 30px;color:#333;font-size:16px;line-height:1.6;">
               <p style="font-size:16px;margin-top:0;">
                  ${saludo}
                </p>

                <div style="margin-top:15px;">
                  ${content.replace(/\n/g, "<br/>")}
                </div>
              </td>
            </tr>

            
            <!-- FOOTER -->
            <tr>
              <td style="background:#f7f9fc;padding:20px;text-align:center;font-size:12px;color:#888;">
                <p style="margin:0;">
                  © ${new Date().getFullYear()} NatArt
                </p>
                <p style="margin:6px 0 0 0;">
                  Este mensaje fue enviado desde la plataforma oficial.
                </p>
              </td>
            </tr>

          </table>

        </td>
      </tr>
    </table>

  </body>
  </html>
  `;
};
