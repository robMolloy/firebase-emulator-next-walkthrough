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
    projectId: "my-readWriteIfUserIsInChatGroup-project",
    firestore: {
      rules: readFileSync(path.resolve(__dirname, "./firestore.rules"), "utf8"),
      host: "127.0.0.1",
      port: 8080,
    },
  });

describe("firestore rules for a readWriteIfUserIsInChatGroup", () => {
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

  it("should allow a create from readWriteIfUserIsInChatGroup if user is doc owner and is a member of the specified chatGroup", async () => {
    const collectionName = "readWriteIfUserIsInChatGroup";
    const myUid = "id_logged_in_my_user";
    const friendUid = "id_logged_in_friend_user";
    const outsiderUid = "id_logged_in_outsider";
    const chatGroupId = "id_chat_group";
    const myAuthedDb = testEnv.authenticatedContext(myUid).firestore();

    // await testEnv.withSecurityRulesDisabled(async (context) => {
    //   const db = context.firestore();
    //   const chatDocRef = doc(db, collectionName, "chatId1");
    //   const chatGroupRef = doc(db, "chatGroup", chatGroupId);

    //   await setDoc(chatDocRef, { content: "lorem", chatGroupId, uid: myUid });
    //   await setDoc(chatGroupRef, { userIds: [myUid, friendUid] });
    // });

    const chatDocRef = doc(myAuthedDb, collectionName, "chatId1");
    const chatGroupRef = doc(myAuthedDb, "chatGroups", chatGroupId);

    await assertSucceeds(setDoc(chatGroupRef, { userIds: [myUid, friendUid] }));
    await assertSucceeds(
      setDoc(chatDocRef, { content: "lorem", chatGroupId, uid: myUid })
    );
  });
});
//
