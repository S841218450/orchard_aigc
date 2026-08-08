import JSEncrypt from "jsencrypt";

let encryptInstance: JSEncrypt | null = null;
let cachedPublicKey = "";

function getEncryptInstance(publicKey: string): JSEncrypt {
  if (!encryptInstance || cachedPublicKey !== publicKey) {
    encryptInstance = new JSEncrypt();
    const ok = encryptInstance.setPublicKey(publicKey);
    if (!ok) {
      throw new Error("[encrypt] RSA 公钥格式非法");
    }
    cachedPublicKey = publicKey;
  }
  return encryptInstance;
}

export function setRsaPublicKey(publicKey: string) {
  const instance = new JSEncrypt();
  const ok = instance.setPublicKey(publicKey);
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
    throw new Error("[encrypt] RSA 公钥缺失，请先从后端获取公钥再调用 encryptPassword");
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
