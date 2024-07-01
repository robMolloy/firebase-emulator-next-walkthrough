import { readFileSync } from "fs";
import path from "path";
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  setLogLevel,
} from "firebase/firestore";

export async function expectFirestorePermissionDenied(promise: Promise<any>) {
  const errorResult = await assertFails(promise);
  expect(errorResult.code).toBe("permission-denied" || "PERMISSION_DENIED");
}

let testEnv: RulesTestEnvironment;

const getTestEnvironment = async () =>
  initializeTestEnvironment({
    projectId: "my-project",
    firestore: {
      rules: readFileSync(path.resolve(__dirname, "./firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });

describe("firestore rules for a readAndCreateCollection", () => {
  beforeAll(async () => {
    setLogLevel("error");
    testEnv = await getTestEnvironment();
  });
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  afterAll(() => {
    testEnv.cleanup();
  });

  it("should not allow a get from a random collection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), "someRandomCollection", "id1");
      await setDoc(docRef, { some: "data" });
    });

    const docRef = doc(unauthedDb, "someRandomCollection", "id1");
    const errorResult = await assertFails(getDoc(docRef));
    expect(errorResult.code).toBe("permission-denied" || "PERMISSION_DENIED");
  });

  it("should allow a get from a readAndCreateCollection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const docRef = doc(db, "readAndCreateCollection", "id1");
      await setDoc(docRef, { some: "data" });
    });

    const docRef = doc(unauthedDb, "readAndCreateCollection", "id1");
    await assertSucceeds(getDoc(docRef));
  });

  it("should allow a getMany (list) query from a readAndCreateCollection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const promises = [1, 2, 3].map((x) => {
        const docRef = doc(db, "readAndCreateCollection", `id${x}`);
        return setDoc(docRef, { some: "data" });
      });
      await Promise.all(promises);
    });

    const docs: unknown[] = [];
    const q = query(collection(unauthedDb, "readAndCreateCollection"));
    const allDocs = await assertSucceeds(getDocs(q));
    allDocs.forEach((x) => docs.push(x));
    expect(docs.length).toBe(3);
  });

  it("should only allow a comment to be created if logged in and uid is passed in document", async () => {
    const uid = "logged_in_user";
    const authedDb = testEnv.authenticatedContext(uid).firestore();
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    const collRef = collection(authedDb, "readAndCreateCollection");
    const docRef = doc(authedDb, "readAndCreateCollection", `id1`);
    const docRef2 = doc(authedDb, "readAndCreateCollection", `id2`);
    const unauthedDocRef = doc(unauthedDb, "readAndCreateCollection", `id3`);

    await assertSucceeds(setDoc(docRef, { some: "data", uid }));
    await assertSucceeds(addDoc(collRef, { some: "data", uid }));
    await assertFails(setDoc(docRef2, { some: "data", uid: "randomUid" }));
    await assertFails(setDoc(unauthedDocRef, { some: "data", uid }));
  });

  it("should not allow an update from a readAndCreateCollection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const authedDb = testEnv.authenticatedContext("someUserId").firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const promises = [1, 2, 3].map((x) => {
        const docRef = doc(db, "readAndCreateCollection", `id${x}`);
        return setDoc(docRef, { some: "data" });
      });
      await Promise.all(promises);
    });

    const docRef = doc(unauthedDb, "readAndCreateCollection", `id1`);
    const authedDocRef = doc(authedDb, "readAndCreateCollection", `id2`);

    await assertFails(setDoc(docRef, { some: "data" }));
    await assertFails(setDoc(authedDocRef, { some: "data" }));
  });

  it("should not allow an update from a readAndCreateCollection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();
    const authedDb = testEnv.authenticatedContext("someUserId").firestore();
    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const promises = [1, 2, 3].map((x) => {
        const docRef = doc(db, "readAndCreateCollection", `id${x}`);
        return setDoc(docRef, { some: "data" });
      });
      await Promise.all(promises);
    });
    //

    const docRef = doc(unauthedDb, "readAndCreateCollection", `id1`);
    const authedDocRef = doc(authedDb, "readAndCreateCollection", `id2`);

    await assertFails(deleteDoc(docRef));
    await assertFails(deleteDoc(authedDocRef));
  });
});
