import { auth, db } from "@/config/firebase-config";
import {
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { v4 } from "uuid";

export default function Home() {
  const [diceValue, setDiceValue] = useState<number>();
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<User>();

  useEffect(() => {
    onAuthStateChanged(auth, (user) => {
      console.log(user);
      const isSignedInInternal = !!user?.uid;
      setIsSignedIn(isSignedInInternal);
      setUser(user ? user : undefined);
    });
  }, []);

  return (
    <main>
      <div className="flex gap-4">
        {!isSignedIn && (
          <>
            <button
              className="btn btn-primary"
              onClick={async () => {
                await createUserWithEmailAndPassword(
                  auth,
                  "robmolloy@hotmail.co.uk",
                  "robmolloy@hotmail.co.uk"
                );
              }}
            >
              Create User
            </button>
            <button
              className="btn btn-primary"
              onClick={async () => {
                const userCredential = await signInWithEmailAndPassword(
                  auth,
                  "robmolloy@hotmail.co.uk",
                  "robmolloy@hotmail.co.uk"
                );
              }}
            >
              signin User
            </button>
          </>
        )}
        {isSignedIn && (
          <button
            className="btn btn-primary"
            onClick={async () => {
              await signOut(auth);
            }}
          >
            signout
          </button>
        )}
      </div>

      <br />
      <br />
      <div>
        {isSignedIn ? (
          <>
            <button
              className="btn btn-primary"
              onClick={async () => {
                const newDiceValue = Math.ceil(Math.random() * 6);
                setDiceValue(newDiceValue);
                await setDoc(doc(db, "diceRolls", v4()), {
                  value: newDiceValue,
                  uid: user?.uid,
                });
              }}
            >
              Roll dice
            </button>
            <p className="text-lg">{diceValue}</p>
          </>
        ) : (
          <div>Sign in to start</div>
        )}
      </div>
    </main>
  );
}
