const TOKEN = process.env.APIS_PERU_TOKEN;

exports.consultarDni = async (req, res) => {
  const { dni } = req.params;
  if (!dni || dni.length !== 8) {
    return res.status(400).json({ message: 'DNI inválido' });
  }
  try {
    const response = await fetch(`https://dniruc.apisperu.com/api/v1/dni/${dni}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error consultando RENIEC:', error);
    res.status(500).json({ message: 'Error consultando RENIEC' });
  }
};

exports.consultarRuc = async (req, res) => {
  const { ruc } = req.params;
  if (!ruc || ruc.length !== 11) {
    return res.status(400).json({ message: 'RUC inválido' });
  }
  try {
    const response = await fetch(`https://dniruc.apisperu.com/api/v1/ruc/${ruc}`, {
      headers: { Authorization: `Bearer ${TOKEN}` }
    });
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('Error consultando SUNAT:', error);
    res.status(500).json({ message: 'Error consultando SUNAT' });
  }
};