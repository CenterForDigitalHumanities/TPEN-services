export default function getHash(agent) {
  if (agent) {
    return agent.split("id/").pop()
  }
  throw new Error("No agent provided")
}
