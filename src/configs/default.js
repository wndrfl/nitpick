module.exports = {
  extends: 'lighthouse:default',

	  categories: {
	    rando: {
	      title: 'Rando',
	      description: 'This category judges your performance',
	      auditRefs: [
	        {id: 'first-meaningful-paint', weight: 2, group: 'metrics'},
	        {id: 'first-cpu-idle', weight: 3, group: 'metrics'},
	        {id: 'interactive', weight: 5, group: 'metrics'},
	      ],
	    }
	  }
	
};