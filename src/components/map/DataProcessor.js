export const processMunicipiosData = (municipios) => {
    return municipios.map((row) => {
      const porcentagem = row["% moradores cobertos"]?.replace("%", "").replace(",", ".") || "0";
      console.log('Porcentagem processada:', porcentagem);
      return {
        ...row,
        "% moradores cobertos": parseFloat(porcentagem),
        "Código IBGE": row["Código IBGE"] ? String(row["Código IBGE"].trim()) : "Desconhecido",
      };
    });
  };

