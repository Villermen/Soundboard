import $ from 'jquery';
import Sample from './Sample';

class SampleContainer {

  /** @type jQuery */
  $sampleContainer;

  /** @type Sample[] */
  samples = [];

  /** @type string */
  sortType = 'recent';

  /** @type string */
  query = '';

  constructor() {
    this.$sampleContainer = $('.sample-container');
  }

  setSamples(samples) {
    // Sort samples
    const sortLimit = new Date().getTime() - 14 * 24 * 60 * 60 * 1000;

    samples.sort((sample1, sample2) => {
      if (sample1.mtime > sortLimit || sample2.mtime > sortLimit) {
        return sample2.mtime - sample1.mtime;
      }

      return 2 * Math.floor(2 * Math.random()) - 1;
    });

    // Create Sample objects
    this.samples = samples.map((data) => new Sample(data));

    // Add the samples to the DOM
    this.samples.forEach((sample) => {
      this.$sampleContainer.append(sample.$sample);
    });

    this.update();
  }

  update() {
    const $prev = this.$sampleContainer.prev();

    this.$sampleContainer.detach();

    if (this.query.trim() === '') {
      this.samples.forEach((sample) => {
        sample.$sample.removeClass('sample--filtered');
      });
    } else {
      // Prepare regex
      const terms = this.query.split(' ');
      const regex = new RegExp(`.*${
        terms.map(term => `(?=.*${term}.*)`).join('')
      }.*`, 'i');

      // Filter samples
      this.samples.forEach((sample) => {
        sample.$sample.toggleClass('sample--filtered', !regex.test(sample.name));
      });
    }

    this.$sampleContainer.insertAfter($prev);
  }

  setQuery(query) {
    this.query = query;
  }

}

export default SampleContainer;