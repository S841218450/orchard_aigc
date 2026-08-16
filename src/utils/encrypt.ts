import JSEncrypt from "jsencrypt";

let encryptInstance: JSEncrypt | null = null;
let cachedPublicKey = "";

// jsencrypt 的 setPublicKey 不返回布尔值（3.5.4 实测返回 undefined），
// 因此用 try-catch + getKey() 判断公钥解析是否成功
function setPublicKeyChecked(instance: JSEncrypt, publicKey: string): boolean {
  try {
    instance.setPublicKey(publicKey);
    return Boolean(instance.getKey());
  } catch {
    return false;
  }
}

function getEncryptInstance(publicKey: string): JSEncrypt {
  if (!encryptInstance || cachedPublicKey !== publicKey) {
    const instance = new JSEncrypt();
    if (!setPublicKeyChecked(instance, publicKey)) {
      throw new Error("[encrypt] RSA 公钥格式非法");
    }
    encryptInstance = instance;
    cachedPublicKey = publicKey;
  }
  return encryptInstance;
}

export function setRsaPublicKey(publicKey: string) {
  const instance = new JSEncrypt();
  const ok = setPublicKeyChecked(instance, publicKey);
  if (ok) {
    encryptInstance = instance;
    cachedPublicKey = publicKey;
  }
  return ok;
}

export function encryptPassword(password: string, publicKey: string): string {
  if (!password || typeof password !== "string") {
    throw new Error("[encrypt] 密码不能为空或格式非法");
  }

  const trimmed = password.trim();
  if (!trimmed) {
    throw new Error("[encrypt] 密码不能为空");
  }
  if (!publicKey) {
    throw new Error(
      "[encrypt] RSA 公钥缺失，请先从后端获取公钥再调用 encryptPassword",
    );
  }

  const instance = getEncryptInstance(publicKey);
  const encrypted = instance.encrypt(trimmed);
  if (typeof encrypted === "string" && encrypted.length > 0) {
    return encrypted;
  }
  throw new Error("[encrypt] RSA 加密失败");
}

export default {
  encryptPassword,
  setRsaPublicKey,
};
