
  import BuiltinTranslator from '../../translateVoodooCRDP.js';
  import {WorldName} from '../../translateVoodooCRDP.js';

  //export const WorldName = 'PlanetZanj-Projector';
  export const Overrides = new Set([]);

  const SHORT_TIMEOUT = 1000;

  export default function translator(e, handled = {type:'case'}) {
    handled.type = handled.type || 'case';
    const TranslatedE = BuiltinTranslator(e, handled);
    const alreadyHandled = handled.type == 'case';
    const weDoNotOverrideHandling = ! Overrides.has(e.type);
    if ( alreadyHandled && weDoNotOverrideHandling ) {
      return TranslatedE;
    }
    switch(e.type) {
      case "enableProjector": {
        return {
          command: {
            isZombieLordCommand: true,
            name: "Connection.enableMode",
            params: {
              pluginName: 'projector'
            }
          }
        };
      }
      case "getDOMSnapshot": {
        const force = e.force;
        return [
          {
            command: {
              isZombieLordCommand: true,
              name: "Connection.getContextIdsForActiveSession",
              params: {
                worldName: WorldName
              }
            }
          },
          ({contextIds: contextIds = []}) => contextIds.map(contextId => ({
            command: {
              name: "Runtime.evaluate",
              params: {
                expression: `getDOMSnapshot(${force});`,
                contextId: contextId,
                timeout: SHORT_TIMEOUT
              },
            }
          }))
        ];
      }
    }
    return e;
  }
