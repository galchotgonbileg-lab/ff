export function getAuthErrorMessage(err: any): string {
  if (!err?.response) {
    return "Сүлжээний алдаа. Интернет холболтоо шалгаад дахин оролдоно уу.";
  }

  const { status, data } = err.response;

  if (status === 429) {
    return "Хэт олон удаа оролдлоо. Түр хүлээгээд дахин оролдоно уу.";
  }

  if (status === 401) {
    return "И-мэйл эсвэл нууц үг буруу байна.";
  }

  if (status === 409) {
    return "Энэ и-мэйл эсвэл нэр аль хэдийн бүртгэгдсэн байна.";
  }

  if (status === 400) {
    return "Мэдээллээ шалгаад дахин оруулна уу.";
  }

  return data?.error ?? "Дахин оролдоно уу.";
}

export function getPhoneAuthErrorMessage(err: any): string {
  if (!err?.response) {
    return "Сүлжээний алдаа. Интернет холболтоо шалгаад дахин оролдоно уу.";
  }
  return err.response.data?.error ?? "Дахин оролдоно уу.";
}
