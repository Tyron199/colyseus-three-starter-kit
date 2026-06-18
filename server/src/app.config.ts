import { defineServer, defineRoom, monitor, playground } from "colyseus";

/**
 * Import your Room files
 */
import { GameRoom } from "./rooms/GameRoom.js";

const server = defineServer({
    /**
     * Define your room handlers:
     *
     * Add more rooms here as your game grows. If you want matchmaking with a
     * live room list, also register Colyseus' built-in `LobbyRoom` and call
     * `.enableRealtimeListing()` on the rooms you want listed.
     */
    rooms: {
        game: defineRoom(GameRoom),
    },

    /**
     * Bind your custom express routes here:
     * Read more: https://expressjs.com/en/starter/basic-routing.html
     */
    express: (app) => {
        /**
         * Use @colyseus/monitor
         * It is recommended to protect this route with a password
         * Read more: https://docs.colyseus.io/tools/monitoring/#restrict-access-to-the-panel-using-a-password
         */
        app.use("/monitor", monitor());

        /**
         * Use @colyseus/playground
         * (It is not recommended to expose this route in a production environment)
         */
        if (process.env.NODE_ENV !== "production") {
            app.use("/", playground());
        }
    },

});

export default server;
