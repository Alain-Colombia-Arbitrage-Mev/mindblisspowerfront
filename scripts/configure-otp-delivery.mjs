import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const region = "us-east-1";
const poolId = "us-east-1_8tLjOfPH1";
const clientId = "2daar7hvc5joua65e6kkil277v";
const configurationSet = "cognito-otp";
const apply = process.argv.includes("--apply");

function aws(service, operation, input) {
  const output = execFileSync("aws", [service, operation, "--region", region, "--no-cli-pager", "--output", "json",
    ...(input ? ["--cli-input-json", JSON.stringify(input)] : [])], {
    encoding: "utf8", env: { ...process.env, PYTHONIOENCODING: "utf-8" }, stdio: ["ignore", "pipe", "pipe"],
  });
  return output.trim() ? JSON.parse(output) : {};
}

const account = aws("sts", "get-caller-identity");
if (account.Account !== "522814703714") throw new Error("Unexpected AWS account");
const original = aws("cognito-idp", "describe-user-pool-client", { UserPoolId: poolId, ClientId: clientId }).UserPoolClient;
// UpdateUserPoolClient resets unspecified settings. Preserve every writable field.
const schema = JSON.parse(execFileSync("aws", ["cognito-idp", "update-user-pool-client", "--generate-cli-skeleton", "input"], { encoding: "utf8" }));
const preserved = Object.fromEntries(Object.entries(original).filter(([key]) => Object.hasOwn(schema, key)));
const destination = {
  Enabled: true,
  MatchingEventTypes: ["SEND", "DELIVERY", "DELIVERY_DELAY", "BOUNCE", "COMPLAINT", "REJECT", "RENDERING_FAILURE"],
  CloudWatchDestination: { DimensionConfigurations: [{ DimensionName: "ses:configuration-set", DimensionValueSource: "MESSAGE_TAG", DefaultDimensionValue: configurationSet }] },
};
const existing = aws("sesv2", "get-configuration-set-event-destinations", { ConfigurationSetName: configurationSet }).EventDestinations;
const eventName = "mindbliss-otp-metrics";
const prior = existing.find((event) => event.Name === eventName);
const logConfig = aws("cognito-idp", "get-log-delivery-configuration", { UserPoolId: poolId }).LogDeliveryConfiguration;
const logConfigurations = logConfig?.LogConfigurations || [];
console.log(JSON.stringify({ apply, poolId, clientId, beforeSessionMinutes: original.AuthSessionValidity, afterSessionMinutes: 10, metrics: eventName }));
if (apply) {
  const backupDir = resolve(process.env.TEMP || ".", "mindbliss-otp-config-backups");
  mkdirSync(backupDir, { recursive: true });
  const backupPath = resolve(backupDir, `otp-${Date.now()}.json`);
  writeFileSync(backupPath, JSON.stringify({ client: preserved, eventDestination: prior || null, logConfigurations }, null, 2));
  console.log(`Configuration backup: ${backupPath}`);
  if (original.AuthSessionValidity !== 10) {
    aws("cognito-idp", "update-user-pool-client", { ...preserved, AuthSessionValidity: 10 });
  }
  aws("sesv2", prior ? "update-configuration-set-event-destination" : "create-configuration-set-event-destination", {
    ConfigurationSetName: configurationSet, EventDestinationName: eventName, EventDestination: destination,
  });
  if (!logConfigurations.some((item) => item.EventSource === "userNotification")) {
    aws("cognito-idp", "set-log-delivery-configuration", {
      UserPoolId: poolId,
      LogConfigurations: [...logConfigurations, {
        LogLevel: "ERROR", EventSource: "userNotification",
        CloudWatchLogsConfiguration: { LogGroupArn: "arn:aws:logs:us-east-1:522814703714:log-group:OTPDeliveryLogs" },
      }],
    });
  }
  const checked = aws("cognito-idp", "describe-user-pool-client", { UserPoolId: poolId, ClientId: clientId }).UserPoolClient;
  if (checked.AuthSessionValidity !== 10) throw new Error("Session duration did not persist");
  for (const [key, value] of Object.entries(preserved)) {
    if (key !== "AuthSessionValidity" && JSON.stringify(checked[key]) !== JSON.stringify(value)) {
      throw new Error(`Unexpected change to client setting: ${key}`);
    }
  }
  const checkedLogs = aws("cognito-idp", "get-log-delivery-configuration", { UserPoolId: poolId }).LogDeliveryConfiguration;
  if (!checkedLogs.LogConfigurations.some((item) => item.EventSource === "userNotification")) throw new Error("Notification error logs were not enabled");
  console.log("Cognito session duration, notification error logs and dedicated SES metrics verified.");
}
