import { readFileSync } from "fs";
import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { addDoc, collection, doc, getDoc, setDoc } from "firebase/firestore";

export async function expectFirestorePermissionDenied(promise: Promise<any>) {
  const errorResult = await assertFails(promise);
  expect(errorResult.code).toBe("permission-denied" || "PERMISSION_DENIED");
}

let testEnv: RulesTestEnvironment;

const getTestEnvironment = async () =>
  initializeTestEnvironment({
    projectId: "my-project",
    firestore: {
      rules: readFileSync("firestore.rules", "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });

describe("firestore rules", () => {
  beforeAll(async () => {
    testEnv = await getTestEnvironment();
  });
  beforeEach(async () => {
    await testEnv.clearFirestore();
  });
  afterAll(() => {
    testEnv.cleanup();
  });

  it("should block a read from a random collection", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), "someRandomCollection", "id1");
      await setDoc(docRef, { some: "data" });
    });

    const docRef = doc(unauthedDb, "someRandomCollection", "id1");
    const errorResult = await assertFails(getDoc(docRef));
    expect(errorResult.code).toBe("permission-denied" || "PERMISSION_DENIED");
  });

  it("should allow a read from comments", async () => {
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const docRef = doc(context.firestore(), "comments", "id2");
      await setDoc(docRef, { some: "data" });
    });

    const docRef = doc(unauthedDb, "comments", "id2");
    await assertSucceeds(getDoc(docRef));
  });

  it("should allow a comment to be created if logged in", async () => {
    const uid = "logged_in_user";
    const authedDb = testEnv.authenticatedContext(uid).firestore();

    const docRef = doc(authedDb, "comments", `id1`);
    await assertSucceeds(setDoc(docRef, { some: "data", uid }));

    const colRef = collection(authedDb, "comments");
    await assertSucceeds(addDoc(colRef, { some: "data", uid }));
  });
});
