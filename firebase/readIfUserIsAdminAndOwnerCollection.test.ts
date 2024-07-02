import {
  RulesTestEnvironment,
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, setLogLevel } from "firebase/firestore";
import { readFileSync } from "fs";
import path from "path";

async function expectFirestorePermissionDenied(promise: Promise<any>) {
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

describe("firestore rules for a readIfUserIsAdminAndOwnerCollectionAndOwnerCollection", () => {
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
    expectFirestorePermissionDenied(getDoc(docRef));
  });

  it("should allow a get from readIfUserIsAdminAndOwnerCollection if user is owner and isAdmin:true", async () => {
    const collectionName = "readIfUserIsAdminAndOwnerCollection";
    const uid = "id_logged_in_user";
    const uid2 = "id_logged_in_user2";
    const authedDb = testEnv.authenticatedContext(uid).firestore();
    const unauthedDb = testEnv.unauthenticatedContext().firestore();

    await testEnv.withSecurityRulesDisabled(async (context) => {
      const db = context.firestore();
      const adminOwnedDocRef = doc(db, collectionName, "docId1");
      const nonAdminOwnedDocRef = doc(db, collectionName, "docId2");
      const adminUserRef = doc(db, "users", uid);
      const nonAdminUserRef2 = doc(db, "users", uid2);

      await setDoc(adminOwnedDocRef, { some: "data", uid });
      await setDoc(nonAdminOwnedDocRef, { some: "data", uid2 });
      await setDoc(adminUserRef, { uid, isAdmin: true });
      await setDoc(nonAdminUserRef2, { uid, isAdmin: false });
    });

    const adminOwnedDocRef = doc(authedDb, collectionName, "docId1");
    const nonAdminOwnedDocRef = doc(authedDb, collectionName, "docId2");
    const unauthedDocRef = doc(unauthedDb, collectionName, "docId1");

    await assertSucceeds(getDoc(adminOwnedDocRef));
    await assertFails(getDoc(nonAdminOwnedDocRef));
    await assertFails(getDoc(unauthedDocRef));
  });
});
//
