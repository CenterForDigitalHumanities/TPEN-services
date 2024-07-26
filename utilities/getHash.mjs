export default function getHash(agent) {
  if (agent) {
    return agent.split("id/").pop()
  } else {
    return new Error({
      status: 404,
      message: "No agent provided"
    })
  }
}
