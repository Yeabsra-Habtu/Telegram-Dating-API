import { ExtendedError } from "socket.io/dist/namespace";
import { ISocket, TokenTypeEnum } from "../base.interface";
import { verifyToken } from "../helpers/jwt";

export default async function socketMiddleware(
  socket: ISocket,
  next: (err?: ExtendedError | undefined) => void
) {
  const authorization = socket.handshake.headers.authorization; // extract authorization from header
  if (authorization) {
    try {
      console.log(authorization);
      const token = verifyToken(authorization.replace("Bearer ", "")); // verify token
      console.log(token);
      // check if user id exist
      if (token.userId && token.type === TokenTypeEnum.chat) {
        socket.user = { id: token.userId as string }; // add user id to socket
        next();
      } else next(new Error("Unauthorized"));
    } catch (error) {
      next(new Error("Unauthorized"));
    }
  } else next(new Error("Unauthorized"));
}
