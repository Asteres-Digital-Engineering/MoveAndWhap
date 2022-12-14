import { isEmpty, remove } from "lodash";
import popupS from "popups";
import { CONTRACT_DIRECTION } from "../constants/contracts";
import {
  BOAT_CONTAINER_HEIGHT,
  BOAT_CONTAINER_WIDTH,
  INITIAL_ZOOM,
} from "../constants/pixi";
import { HOME } from "../constants/routes";
import { COMMANDS } from "../constants/webSockets";
import { formatBoatData } from "../utils/contract";
import { convertPlayerPositionToGameCoordinate } from "../utils/numbers";
import pixiApp from "./app";
import Boat from "./boat";
import PositionMapper from "./positionMapper";

export const onWsOpen = () => {
  console.log("Connected to websocket server.");
};

export const onWsMessage = (event) => {
  const data = JSON.parse(event.data);

  console.log("event.data", event.data);

  switch (data.command) {
    case COMMANDS.getPlayersInRange:
      handleReceivePlayersInRange(data);
      break;

    case COMMANDS.playerJoined:
      handlePlayerJoined(data);
      break;

    case COMMANDS.playerMoved:
      handlePlayerMoved(data);
      break;

    case COMMANDS.playerAttacked:
      handlePlayerAttacked(data);
      break;

    case COMMANDS.error:
      console.log(data);
      break;

    default:
      break;
  }
};

const handleReceivePlayersInRange = (wsResponse) => {
  const currentPlayerAddress = pixiApp.getWalletAddress();

  let { data } = wsResponse;

  const currentPlayer = remove(data, (boat) => {
    return boat.address === currentPlayerAddress;
  });

  // Reset all the current positions mapping and let the boat re-init the mapping.
  PositionMapper.resetMapPosition();

  data.forEach((player) => {
    addPlayerToGame({ player, currentPlayerAddress });
  });

  if (isEmpty(currentPlayer)) return;

  // Player boat must be created last in the list
  addPlayerToGame({ player: currentPlayer[0], currentPlayerAddress });
};

export const addPlayerToGame = ({ player, currentPlayerAddress }) => {
  const { x, y, dir, address } = player;
  const playerBoat = formatBoatData([x, y, dir, true]);

  const playerBoatPosition = convertPlayerPositionToGameCoordinate({
    x: playerBoat.x,
    y: playerBoat.y,
  });

  const isCurrentPlayer = address === currentPlayerAddress;

  const boat = addBoatToScreen({
    playerPosition: playerBoatPosition,
    address,
    isCurrentPlayer,
    directionNum: playerBoat.directionNum,
  });

  if (isCurrentPlayer) {
    const viewport = pixiApp.getViewport();
    viewport.zoom(INITIAL_ZOOM, true);
  }

  return boat;
};

const addBoatToScreen = ({
  playerPosition,
  address,
  isCurrentPlayer,
  directionNum,
}) => {
  const { x, y } = playerPosition;
  const headDirection = CONTRACT_DIRECTION[directionNum];

  const boat = new Boat({
    boatContainerOptions: {
      x,
      y,
      width: BOAT_CONTAINER_WIDTH,
      height: BOAT_CONTAINER_HEIGHT,
    },
    address,
    isCurrentPlayer,
    headDirection,
  });

  return boat;
};

export const getPlayersInRange = async ({ x, y, range }) => {
  const ws = pixiApp.getSocket();
  if (!ws) return;

  const msg = JSON.stringify({
    command: "getPlayersInRange",
    x: x,
    y: y,
    range: range,
  });
  ws.send(msg);
};

const handlePlayerJoined = (wsResponse) => {
  const { data, address } = wsResponse;

  const isCurrentPlayerJoined = isCurrentPlayerAddress(address);

  addPlayerToGame({
    player: { ...data, address },
    currentPlayerAddress: address,
  });

  if (isCurrentPlayerJoined) {
    const viewport = pixiApp.getViewport();
    const { x, y } = convertPlayerPositionToGameCoordinate({
      x: data.x,
      y: data.y,
    });

    viewport.moveCenter(x, y);
  }
};

const handlePlayerMoved = (wsResponse) => {
  const { data, address } = wsResponse;
  const playerBoat = PositionMapper.getBoatByAddress(address);

  if (!playerBoat) {
    console.log("Player boat not found on screen.");
    return;
  }
  const isCurrentPlayer = isCurrentPlayerAddress(address);

  // This move already been handled by the Boat class
  if (isCurrentPlayer) {
    return;
  }

  const { dir } = data;

  playerBoat.move(dir);
};

const isCurrentPlayerAddress = (address) => {
  const currentPlayerAddress = pixiApp.getWalletAddress();
  const isCurrentPlayer = currentPlayerAddress === address;
  return isCurrentPlayer;
};

const handlePlayerAttacked = (wsResponse) => {
  const { data } = wsResponse;
  const { attacker, victim } = data;

  // Fire animation has been handled by the BoatArrowsController class for the current player
  if (isCurrentPlayerAddress(attacker)) return;

  const handleGameOver = () => {
    // Only game over if the current player is the victim
    if (!isCurrentPlayerAddress(victim)) return;

    popupS.alert({
      title: "Game Over",
      content: "You have been defeated! <br /> Try again next time!",
      labelOk: "Back to Lobby",
      onSubmit: () => {
        window.location.href = HOME;
      },
      additionalButtonOkClass: "popupS-button-ok-custom",
      additionalPopupClass: "flex justify-center flex-col items-center",
      additionalCloseBtnClass: "hidden",
    });
  };

  PositionMapper.attackAndRemovedTargetBoat({
    attackerBoatAddress: attacker,
    victimBoatAddress: victim,
    onExplodeAnimationComplete: handleGameOver,
  });
};
