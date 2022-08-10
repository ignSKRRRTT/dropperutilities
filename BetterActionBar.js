import { formatTime } from "./utils.js"

export class BetterActionBar {
  constructor(clientHandler) {
    this.clientHandler = clientHandler
    this.userClient = clientHandler.userClient
    this.proxyClient = clientHandler.proxyClient
    this.stateHandler = clientHandler.stateHandler

    this.sendInterval = null

    this.bindEventListeners()
    this.bindModifiers()
  }

  bindModifiers() {
    this.clientHandler.incomingModifiers.push(this.handleIncomingPacket.bind(this))
  }

  handleIncomingPacket(data, meta) {
    if (meta.name !== "chat") return
    if (data.position !== 2) return
    if (this.stateHandler.state === "game") return {
      type: "cancel"
    }
  }

  bindEventListeners() {
    this.stateHandler.on("state", state => {
      if (state === "game") {
        if (!this.sendInterval) {
          this.sendInterval = setInterval(() => {
            this.sendActionBar()
          }, 50)
        }
      } else {
        if (this.sendInterval) {
          clearInterval(this.sendInterval)
          this.sendInterval = null
        }
      }
    })
  }

  sendActionBar() {
    let text = "§a"
    let state = this.stateHandler.gameState
    if (state === "waiting") {
      state = "Waiting"
    } else if (state === 6) {
      state = "Finished"
    } else {
      state = state.toString()
    }
    if (state === "Waiting") {
      text += "Countdown§8"
    } else if (state === "Finished") {
      text += "Finished§8"
    } else {
      text += "Map " + state + "§8"
    }
    text += " -§f"
    let runTime
    if (state === "Finished") {
      if (this.stateHandler.totalTime !== null) {
        runTime = formatTime(this.stateHandler.totalTime)
      } else {
        //estimate the total time from a sum of each segment if we haven't gotten the chat message with Hypixel's time yet
        let totalTime = this.stateHandler.times.reduce((partialSum, a) => partialSum + a, 0)
        runTime = formatTime(totalTime)
      }
    } else {
      runTime = formatTime(performance.now() - this.stateHandler.startTime)
    }
    text += " Run Time: §a" + runTime + "§f"
    if (state === "Finished") {
      let realTime = this.stateHandler.times.slice(1).reduce((partialSum, a) => partialSum + a, 0)
      text += " Real Time: §a" + formatTime(realTime) + "§f"
    }
    if (state !== "Waiting" && state !== "Finished") {
      let mapTime = formatTime(performance.now() - this.stateHandler.lastSegmentTime)
      text += " Map Time: §a" + mapTime + "§f"
    }
    this.userClient.write("chat", {
      position: 2,
      message: JSON.stringify({
        text,
      }),
      sender: "00000000-0000-0000-0000-000000000000"
    })
  }
}