import { auth, db } from "./firebase";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, onAuthStateChanged, signOut } from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

document.addEventListener("DOMContentLoaded", () => {
  const postInput = document.getElementById("postInput") as HTMLTextAreaElement;
  const postButton = document.getElementById("postButton") as HTMLButtonElement;
  const timeline = document.getElementById("timeline") as HTMLDivElement;

  const loginBtn = document.getElementById("loginBtn") as HTMLButtonElement;
  const logoutBtn = document.getElementById("logoutBtn") as HTMLButtonElement;
  const registerBtn = document.getElementById("registerBtn") as HTMLButtonElement;
  const saveProfileBtn = document.getElementById("saveProfileBtn") as HTMLButtonElement;

  const emailInput = document.getElementById("emailInput") as HTMLInputElement;
  const passwordInput = document.getElementById("passwordInput") as HTMLInputElement;
  const nameInput = document.getElementById("nameInput") as HTMLInputElement;
  const bikeInput = document.getElementById("bikeInput") as HTMLInputElement;

  let isLoggedIn = false;

  // ログイン状態監視
  onAuthStateChanged(auth, async (user) => {
    isLoggedIn = !!user;

    if (user) {
      postInput.style.display = "block";
      postButton.style.display = "block";
      saveProfileBtn.style.display = "block";
      logoutBtn.style.display = "block";

      loginBtn.style.display = "none";
      registerBtn.style.display = "none";

      // Firestoreからプロフィールを取得して入力フォームに反映
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        nameInput.value = data.name || "";
        bikeInput.value = data.bike || "";
      }

    } else {
      postInput.style.display = "none";
      postButton.style.display = "none";
      saveProfileBtn.style.display = "none";
      logoutBtn.style.display = "none";

      loginBtn.style.display = "block";
      registerBtn.style.display = "block";
    }
  });

  // 新規登録
  registerBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) return alert("メールとパスワードを入力してください");

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), { name: "", bike: "", message: "" });
      alert("登録成功！");
    } catch (error: any) { alert(error.message); }
  });

  // ログイン
  loginBtn.addEventListener("click", async () => {
    const email = emailInput.value;
    const password = passwordInput.value;
    if (!email || !password) return alert("メールとパスワードを入力してください");

    try {
      await signInWithEmailAndPassword(auth, email, password);
      alert("ログイン成功！");
    } catch (error: any) { alert("ログイン失敗：" + error.message); }
  });

  // ログアウト
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      alert("ログアウトしました！");
    } catch (error: any) { alert("ログアウト失敗：" + error.message); }
  });

  // プロフィール保存
  saveProfileBtn.addEventListener("click", async () => {
    const user = auth.currentUser;
    if (!user) return alert("ログインしてください");

    await setDoc(doc(db, "users", user.uid), {
      name: nameInput.value,
      bike: bikeInput.value
    }, { merge: true });

    alert("プロフィール保存完了！");
  });

  // 投稿
  postButton.addEventListener("click", async () => {
    if (!isLoggedIn) return alert("ログインしないと投稿できません");
    const text = postInput.value.trim();
    if (!text) return alert("文字を入力してください");

    const user = auth.currentUser;
    if (!user) return;

    const docRef = doc(db, "users", user.uid);
    const docSnap = await getDoc(docRef);

    let displayName = "名無し";
    if (docSnap.exists()) {
      const data = docSnap.data();
      displayName = `${data.name || "名無し"}（${data.bike || "愛車未設定"}）`;
    }

    const postCard = document.createElement("div");
    postCard.className = "post-card";
    const name = document.createElement("strong");
    name.textContent = displayName;
    const content = document.createElement("p");
    content.textContent = text;

    postCard.appendChild(name);
    postCard.appendChild(content);
    timeline.prepend(postCard);
    postInput.value = "";
  });

});
