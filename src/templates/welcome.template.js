const welcomeMessage = () => {
  return {
    type: 'interactive',
    interactive: {
      type: 'button',
      header: {
        type: 'text',
        text: 'Welcome to Land Record Services',
      },
      body: {
        text: 'Hello! I\'m here to help you with land record services. Please choose the service you need from the options below:',
      },
      action: {
        buttons: [
          {
            type: 'reply',
            reply: {
              id: '8a_service',
              title: '8A Form',
            },
          },
          {
            type: 'reply',
            reply: {
              id: '712_service',
              title: '7/12 Form',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'ferfar_service',
              title: 'Ferfar',
            },
          },
          {
            type: 'reply',
            reply: {
              id: 'property_card_service',
              title: 'Property Card',
            },
          },
        ],
      },
    },
  };
};

const serviceFlowResponse = (serviceType) => {
  const flowData = {
    '8a_service': {
      header: '8A Form Application',
      body: 'Please fill out the 8A form to proceed.',
      flowToken: '8a_flow_token',
    },
    '712_service': {
      header: '7/12 Form Application',
      body: 'Please fill out the 7/12 form to proceed.',
      flowToken: '712_flow_token',
    },
    'ferfar_service': {
      header: 'Ferfar Application',
      body: 'Please fill out the Ferfar form to proceed.',
      flowToken: 'ferfar_flow_token',
    },
    'property_card_service': {
      header: 'Property Card Application',
      body: 'Please fill out the Property Card form to proceed.',
      flowToken: 'property_card_flow_token',
    },
  };

  const service = flowData[serviceType];
  
  return {
    type: 'interactive',
    interactive: {
      type: 'flow',
      header: {
        type: 'text',
        text: service.header,
      },
      body: {
        text: service.body,
      },
      action: {
        name: 'flow',
        parameters: {
          flow_message_version: '3',
          flow_action: 'navigate',
          flow_id: serviceType === '8a_service' ? '1234567890' : 
                   serviceType === '712_service' ? '1234567891' :
                   serviceType === 'ferfar_service' ? '1234567892' : '1234567893',
          flow_cta: 'Start Form',
          flow_token: service.flowToken,
        },
      },
    },
  };
};

module.exports = { welcomeMessage, serviceFlowResponse };
