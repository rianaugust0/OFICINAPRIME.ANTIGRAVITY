export const formatPhone = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  if (v.length > 10) return v.replace(/(\d{2})(\d{5})(\d{4})/, "($1) $2-$3");
  if (v.length > 6) return v.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3");
  if (v.length > 2) return v.replace(/(\d{2})(\d{0,5})/, "($1) $2");
  return v.length ? `(${v}` : v;
};

export const formatDocument = (v: string) => {
  v = v.replace(/\D/g, "");
  if (v.length <= 11) {
    if (v.length > 9) return v.replace(/(\d{3})(\d{3})(\d{3})(\d{1,2})/, "$1.$2.$3-$4");
    if (v.length > 6) return v.replace(/(\d{3})(\d{3})(\d{1,3})/, "$1.$2.$3");
    if (v.length > 3) return v.replace(/(\d{3})(\d{1,3})/, "$1.$2");
    return v;
  } else {
    v = v.slice(0, 14);
    if (v.length > 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{1,2})/, "$1.$2.$3/$4-$5");
    if (v.length > 8) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{1,4})/, "$1.$2.$3/$4");
    if (v.length > 5) return v.replace(/(\d{2})(\d{3})(\d{1,3})/, "$1.$2.$3");
    if (v.length > 2) return v.replace(/(\d{2})(\d{1,3})/, "$1.$2");
    return v;
  }
};

export const formatPlate = (v: string) => {
  v = v.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  if (v.length > 7) v = v.slice(0, 7);
  if (v.length > 3) return `${v.slice(0, 3)}-${v.slice(3)}`;
  return v;
};
