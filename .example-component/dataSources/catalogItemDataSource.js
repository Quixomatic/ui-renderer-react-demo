import AppCatalogViewFragment from './fragments/AppCatalogViewFragment';
import { createQueryFetcher } from '../tf-library-catalog-form/src/dataSource/queryFetcher';

export const createDataSource = () => {
    return createQueryFetcher(AppCatalogViewFragment);
}
