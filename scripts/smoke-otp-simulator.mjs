import { execFileSync } from "node:child_process";
import { createHash, randomUUID } from "node:crypto";
import { buildCognitoSignUpPayload, buildCognitoEmailOtpStartPayload } from "../src/lib/cognito.js";
import { callCognito, getCognitoErrorCode } from "../src/lib/cognito-api.js";

if (!process.argv.includes("--run")) {
  console.log("Use --run to create one temporary Cognito fixture, send only to AWS simulator destinations, and remove the fixture.");
  process.exit(0);
}
const region = "us-east-1";
const poolId = "us-east-1_8tLjOfPH1";
const clientId = "2daar7hvc5joua65e6kkil277v";
const endpoint = `https://cognito-idp.${region}.amazonaws.com/`;
const email = `success+mindbliss-${randomUUID()}@simulator.amazonses.com`;
const username = `mp_${createHash("sha256").update(email).digest("hex").slice(0, 40)}`;
const smsSimulator = "+14254147755";
function aws(service, operation, input) {
  try {
    const output = execFileSync("aws", [service, operation, "--region", region, "--no-cli-pager", "--output", "json", ...(input ? ["--cli-input-json", JSON.stringify(input)] : [])], {
      encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" }, stdio: ["ignore", "pipe", "pipe"],
    });
    return output.trim() ? JSON.parse(output) : {};
  } catch {
    throw new Error(`AWS ${service}/${operation} failed`);
  }
}
if (aws("sts", "get-caller-identity").Account !== "522814703714") throw new Error("Unexpected account");
const client = aws("cognito-idp", "describe-user-pool-client", { UserPoolId: poolId, ClientId: clientId }).UserPoolClient;
const values = {
  email, name: "Mindbliss OTP Simulator", given_name: "Mindbliss", family_name: "Simulator", middle_name: "OTP",
  nickname: "OTP Simulator", preferred_username: username, profile: "member", picture: "https://app.mindblisspower.com/avatar.png",
  website: "https://mindblisspower.com", gender: "unspecified", birthdate: "1990-01-01", zoneinfo: "America/Bogota", locale: "es",
  address: "AWS simulator only", updated_at: String(Math.floor(Date.now() / 1000)), phone_number: smsSimulator,
};
let created = false;
try {
  const signup = await callCognito({ endpoint, target: "SignUp", payload: buildCognitoSignUpPayload({
    clientId, clientSecret: client.ClientSecret || "", username, password: `Aa1!${randomUUID()}`,
    attributes: Object.entries(values).map(([Name, Value]) => ({ Name, Value })),
  }) });
  created = signup.ok;
  console.log(JSON.stringify({ step: "signup", ok: signup.ok, delivery: signup.body.CodeDeliveryDetails?.DeliveryMedium, error: getCognitoErrorCode(signup.body) }));
  if (!signup.ok) throw new Error("Simulator signup failed");
  // This administrative confirmation is restricted to this newly-created simulator fixture.
  aws("cognito-idp", "admin-confirm-sign-up", { UserPoolId: poolId, Username: username });
  for (const challenge of ["EMAIL_OTP", "SMS_OTP"]) {
    const result = await callCognito({ endpoint, target: "InitiateAuth", payload: buildCognitoEmailOtpStartPayload({
      clientId, clientSecret: client.ClientSecret || "", username, preferredChallenge: challenge,
    }) });
    console.log(JSON.stringify({ step: challenge, ok: result.ok, challenge: result.body.ChallengeName, hasSession: Boolean(result.body.Session), error: getCognitoErrorCode(result.body) }));
  }
  const sent = aws("sesv2", "send-email", {
    FromEmailAddress: "Mindbliss Power <no-reply@mindblisspower.com>", Destination: { ToAddresses: [email] }, ConfigurationSetName: "cognito-otp",
    Content: { Simple: { Subject: { Data: "Mindbliss OTP delivery diagnostic" }, Body: { Text: { Data: "Technical delivery test to the AWS mailbox simulator. No customer data or verification code." } } } },
  });
  console.log(JSON.stringify({ step: "ses_simulator", messageId: sent.MessageId }));
} finally {
  if (created) {
    const fixture = aws("cognito-idp", "admin-get-user", { UserPoolId: poolId, Username: username });
    if (fixture.UserAttributes.find((attribute) => attribute.Name === "email")?.Value !== email) throw new Error("Fixture ownership mismatch; cleanup stopped");
    aws("cognito-idp", "admin-delete-user", { UserPoolId: poolId, Username: username });
    console.log("Temporary Cognito fixture removed. No member or RDS records created.");
  }
}
